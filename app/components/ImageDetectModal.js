import React, { Component } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Label
} from "reactstrap";
import i18next from "i18next";
import ReactTooltip from "react-tooltip";
import { getPredictCLassAnnotations } from "../utils/imageDetectService";
import {
    ee,
    EVENT_CREATE_IMAGE_DETECT_ANNOTATION,
    EVENT_CREATE_PREDICT_CLASS_ANNOTATION,
    EVENT_HIDE_WAITING,
} from "../utils/library";
import { convertBoundingBoxToVertices } from "../utils/maths";
import { IMAGE_DETECT_TYPE } from "../constants/constants";
import "../scss/ImageDetectModal.scss";

class ImageDetectModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            services: (props.imageDetectModels || []).map((s) => ({
                ...s,
                status: s.isActive ? "Ready" : "Inactive",
                errorMsg: null,
            })),
            tooltips: {},
            isRunning: false
        };
    }

    updateServiceStatus = (url_service, status, errorMsg = null) => {
        this.setState((prevState) => {
            const updatedServices = prevState.services.map((s) =>
                s.url_service === url_service ? { ...s, status, errorMsg } : s
            );

            const stillRunning = updatedServices.some(
                (s) => s.isActive && s.status === "Running"
            );

            return {
                services: updatedServices,
                isRunning: stillRunning,
            };
        });
    };

    handleStart = () => {
        this.setState({ isRunning: true });

        const { t } = i18next;
        const { imageUrl, pictureSha1 } = this.props;
        const { services } = this.state;

        const activeServices = services.filter((s) => s.isActive);
        if (activeServices.length === 0) {
            window.alert(t("annotate.editor.alert_not_active_image_detect_service"));
            this.setState({ isRunning: false });
            return;
        }

        activeServices.forEach((service) => {
            this.updateServiceStatus(service.url_service, "Running");

            getPredictCLassAnnotations(service.url_service, imageUrl, ({ result, error }) => {
                if (!this.state.isRunning) return;

                if (error || !result) {
                    this.updateServiceStatus(service.url_service, "Error", error || "Unknown error");
                    return;
                }

                if (service.detectionType === "IMAGE_DETECT_TYPE") {
                    const filtered = (result.result || []).filter(
                        (d) => d.confidence >= service.confidence / 100
                    );
                    filtered.forEach((detection, i) => {
                        const { xmax, xmin, ymax, ymin } = detection;
                        const vertices = convertBoundingBoxToVertices(xmax, xmin, ymax, ymin);
                        ee.emit(
                            EVENT_CREATE_IMAGE_DETECT_ANNOTATION,
                            pictureSha1,
                            vertices,
                            detection.confidence,
                            detection.name,
                            detection.class,
                            i
                        );
                    });
                    this.props.leafletImage?.current?._drawAnnotations?.();
                }

                if (service.detectionType === "PREDICT_CLASS_TYPE") {
                    const { class_id, confidence, class_name } = result;
                    ee.emit(
                        EVENT_CREATE_PREDICT_CLASS_ANNOTATION,
                        pictureSha1,
                        confidence,
                        class_name,
                        class_id,
                        service.name
                    );
                }

                this.updateServiceStatus(service.url_service, "Done");
            });

        });
    };

    handleCancel = () => {
        this.setState({ isRunning: false });
        this.setState((prevState) => ({
            services: prevState.services.map((s) =>
                s.status === "Running"
                    ? { ...s, status: "Cancelled" }
                    : s
            )
        }));
    };


    render() {
        const { isOpen, toggle } = this.props;
        const { t } = i18next;
        const { services, tooltips } = this.state;

        return (
            <Modal isOpen={isOpen} size="lg" scrollable toggle={toggle} wrapClassName="bst" autoFocus={false}>
                <ModalHeader toggle={toggle}>
                    {t("annotate.editor.modal_image_detect_title")}
                </ModalHeader>
                <ModalBody>
                    <table className="table table-sm">
                        <thead>
                        <tr>
                            <th>{t("annotate.editor.modal_image_detect_service")}</th>
                            <th>{t("annotate.editor.modal_image_detect_type")}</th>
                            <th>{t("annotate.editor.modal_image_detect_status")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {services.map((service) => {
                            const tooltipId = `tooltip-${btoa(service.url_service).replace(/=/g, '')}`;

                            return (
                                <tr key={service.url_service}>
                                    <td>{service.name}</td>
                                    <td>
                                        <Label>
                                            {service.detectionType === IMAGE_DETECT_TYPE
                                                ? t("annotate.editor.modal_image_detect_organ_detect")
                                                : t("annotate.editor.modal_image_detect_predict_classification")}
                                        </Label>
                                    </td>
                                    <td>
                                        <span
                                            id={tooltipId}
                                            className={`status-badge ${
                                                service.status === "Inactive"
                                                    ? "status-inactive"
                                                    : service.status === "Ready"
                                                        ? "status-ready"
                                                        : service.status === "Running"
                                                            ? "status-running"
                                                            : service.status === "Error"
                                                                ? "status-error"
                                                                : service.status === "Done"
                                                                    ? "status-done"
                                                                    : service.status === "Cancelled"
                                                                        ? "status-cancelled"
                                                                        : ""
                                            }`}
                                            data-tip={
                                                service.status === "Error"
                                                    ? `<pre>${(service.errorMsg || "Unknown error")}</pre>`
                                                    : null
                                            }
                                            data-for={tooltipId}
                                        >
                                          {service.status}
                                        </span>

                                        {service.status === "Error" && (
                                            <ReactTooltip id={tooltipId} place="top" type="error" effect="solid"  html={true}/>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </ModalBody>
                <ModalFooter>
                    {this.state.isRunning ? (
                        <Button color="danger" onClick={this.handleCancel}>
                            {t("global.cancel")}
                        </Button>
                    ) : (
                        <Button color="primary" onClick={this.handleStart}>
                            {t("annotate.editor.modal_image_detect_btn_start")}
                        </Button>
                    )}
                    <Button color="secondary" onClick={toggle}>
                        {t("global.close")}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }
}

export default ImageDetectModal;
