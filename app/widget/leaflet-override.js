//-----------------------------------------------------------------------------------------------------------------------
import L from "leaflet";
import i18next from "i18next";
import './leaflet-angle'
import './leaflet-zoom'
import './leaflet-simpleline'
import './leaflet-occurrence'
import './leaflet-print-button'
import './leaflet-color-picker'
import './leaflet-ratio'
import './leaflet-export-zoi'
import './leaflet-transcription'
import './leaflet-categorical'
import './leaflet-richtext'
import './leaflet-cartel'
import './leaflet-control-menu'

i18next.on('languageChanged', () => {
    overrideLeafletDefaultLabels();
})

/**Changes some of the default text for the toolbar buttons*/
export const overrideLeafletDefaultLabels = () => {
    const { t } = i18next;
    L.drawLocal.draw.toolbar.actions.text = t('global.cancel')
    L.drawLocal.draw.toolbar.actions.title = t('annotate.editor.btn_tooltip_actions')
    L.drawLocal.draw.toolbar.finish.text = t('global.finish')
    L.drawLocal.draw.toolbar.finish.title = t('annotate.editor.btn_tooltip_finish')
    L.drawLocal.draw.toolbar.undo.text = t('annotate.editor.btn_undo')
    L.drawLocal.draw.toolbar.undo.title = t('annotate.editor.btn_tooltip_undo')

    L.drawLocal.draw.toolbar.buttons.polyline = t('annotate.editor.btn_tooltip_multiline_length_tool');
    L.drawLocal.draw.handlers.polyline = {
        tooltip: {
            start: t('annotate.editor.tooltip_click_to_start_drawing_line'),
            cont: t('annotate.editor.tooltip_click_to_continue_drawing_line'),
            end: t('annotate.editor.tooltip_click_last_point_to_finish_line')
        }
    };

    L.drawLocal.draw.toolbar.buttons.polygon = t('annotate.editor.btn_tooltip_surface_tool');
    L.drawLocal.draw.handlers.polygon = {
        tooltip: {
            start: t('annotate.editor.tooltip_click_to_start_drawing_shape'),
            cont: t('annotate.editor.tooltip_click_to_continue_drawing_shape'),
            end: t('annotate.editor.tooltip_click_first_point_to_close_shape')
        }
    };

    L.drawLocal.draw.toolbar.buttons.rectangle = t('annotate.editor.btn_tooltip_rectangle_of_interest');
    L.drawLocal.draw.handlers.rectangle = {
        tooltip: {
            start: t('annotate.editor.tooltip_click_to_start_drawing_rectangle')
        }
    };
    L.drawLocal.draw.handlers.simpleshape = {
        tooltip: {
            end: t('annotate.editor.tooltip_release_mouse_to_finish_drawing')
        }
    };

    L.drawLocal.draw.toolbar.buttons.circlemarker = t('annotate.editor.btn_tooltip_point_of_interest');
    L.drawLocal.draw.toolbar.buttons.marker = t('annotate.editor.btn_tooltip_point_of_interest');
    L.drawLocal.draw.handlers.marker = {
        tooltip: {
            start: t('annotate.editor.tooltip_click_map_to_place_marker'),
        }
    };
    L.drawLocal.draw.toolbar.buttons.occurrence = t('annotate.editor.btn_tooltip_count_tool');
    L.drawLocal.draw.toolbar.buttons.categorical =  t('annotate.editor.btn_tooltip_categorical_tool');
    L.drawLocal.draw.toolbar.buttons.colorPicker = t('annotate.editor.btn_tooltip_color_picker_tool');
    L.drawLocal.draw.toolbar.buttons.cartel = i18next.t('annotate.editor.btn_tooltip_cartel');

    L.drawLocal.draw.toolbar.buttons.angle = t('annotate.editor.btn_tooltip_angle_tool');
    L.drawLocal.draw.handlers.angle = {
        tooltip: {
            start: t('annotate.editor.tooltip_angle_click_for_vertex_point'),
            cont: t('annotate.editor.tooltip_angle_click_to_draw_first_ray'),
            end: t('annotate.editor.tooltip_angle_click_to_draw_second_ray')
        }
    };

    L.drawLocal.draw.toolbar.buttons.simpleline = t('annotate.editor.btn_tooltip_length_tool');
    L.drawLocal.draw.handlers.simpleline = {
        tooltip: {
            start: t('annotate.editor.tooltip_click_to_start_drawing_line'),
            cont: t('annotate.editor.tooltip_click_to_finish_line'),
            end: t('annotate.editor.tooltip_click_last_point_to_finish_line')
        }
    };
    L.drawLocal.draw.toolbar.buttons.ratio = t('annotate.editor.btn_tooltip_measure_ratio');
    L.drawLocal.draw.handlers.ratio = {
        tooltip: {
            start: t('annotate.editor.tooltip_click_to_start_drawing_line'),
            cont: t('annotate.editor.tooltip_click_to_continue_drawing_line'),
            end: t('annotate.editor.tooltip_click_last_point_to_finish_line')
        }
    };
    L.drawLocal.draw.toolbar.buttons.transcription = t('annotate.editor.btn_tooltip_transcription_tool');
    L.drawLocal.draw.handlers.transcription = {
        tooltip: {
            start: t('annotate.editor.tooltip_transcription_tool_click_to_start_drawing_rectangle'),
            cont: t('annotate.editor.tooltip_click_to_continue_drawing_line'),
            end: t('annotate.editor.tooltip_click_last_point_to_finish_line')
        }
    };
    L.drawLocal.draw.toolbar.buttons.richtext = t('annotate.editor.btn_tooltip_text_tool');
    L.drawLocal.draw.handlers.richtext = {
        tooltip: {
            start: t('annotate.editor.tooltip_text_tool_click_to_start_drawing_rectangle'),
            cont: t('annotate.editor.tooltip_click_to_continue_drawing_line'),
            end: t('annotate.editor.tooltip_click_last_point_to_finish_line')
        }
    };

    L.drawLocal.edit.handlers.edit = {
        tooltip: {
            text: '',
            subtext: t('annotate.editor.tooltip_click_cancel_to_undo_changes')
        }
    }
}

export const initLeaflet = () => {
    /*Adds new shape types to the options */
    L.DrawToolbar.include({
        getModeHandlers: function (map) {
            return [
                {
                    enabled: this.options.simpleline,
                    handler: new L.Draw.SimpleLine(map, this.options.simpleline),
                    title: L.drawLocal.draw.toolbar.buttons.simpleline
                },
                {
                    enabled: this.options.polyline,
                    handler: new L.Draw.Polyline(map, this.options.polyline),
                    title: L.drawLocal.draw.toolbar.buttons.polyline
                },
                {
                    enabled: this.options.polygon,
                    handler: new L.Draw.Polygon(map, this.options.polygon),
                    title: L.drawLocal.draw.toolbar.buttons.polygon
                },
                {
                    enabled: this.options.angle,
                    handler: new L.Draw.Angle(map, this.options.angle),
                    title: L.drawLocal.draw.toolbar.buttons.angle
                },
                {
                    enabled: this.options.occurrence,
                    handler: new L.Draw.Occurrence(map, this.options.occurrence),
                    title: L.drawLocal.draw.toolbar.buttons.occurrence
                },
                {
                    enabled: this.options.circle,
                    handler: new L.Draw.Circle(map, this.options.circle),
                    title: L.drawLocal.draw.toolbar.buttons.circle
                },
                {
                    enabled: this.options.marker,
                    handler: new L.Draw.Marker(map, this.options.marker),
                    title: L.drawLocal.draw.toolbar.buttons.marker
                },
                {
                    enabled: this.options.rectangle,
                    handler: new L.Draw.Rectangle(map, this.options.rectangle),
                    title: L.drawLocal.draw.toolbar.buttons.rectangle
                },
                {
                    enabled: this.options.colorPicker,
                    handler: new L.Draw.ColorPicker(map, this.options.colorPicker),
                    title: L.drawLocal.draw.toolbar.buttons.colorPicker
                },
                {
                    enabled: this.options.ratio,
                    handler: new L.Draw.Ratio(map, this.options.ratio),
                    title: L.drawLocal.draw.toolbar.buttons.ratio
                },
                {
                    enabled: this.options.transcription,
                    handler: new L.Draw.Transcription(map, this.options.transcription),
                    title: L.drawLocal.draw.toolbar.buttons.transcription
                },
                {
                    enabled: this.options.categorical,
                    handler: new L.Draw.Categorical(map, this.options.categorical),
                    title: L.drawLocal.draw.toolbar.buttons.categorical
                },
                {
                    enabled: this.options.richtext,
                    handler: new L.Draw.RichText(map, this.options.richtext),
                    title: L.drawLocal.draw.toolbar.buttons.richtext
                },
                {
                    enabled: this.options.cartel,
                    handler: new L.Draw.Cartel(map, this.options.cartel),
                    title: L.drawLocal.draw.toolbar.buttons.cartel
                }
            ];
        }
    });
//-----------------------------------------------------------------------------------------------------------------------
    /**
     * @class L.Edit.PolyVerticesEdit
     * @aka Edit.PolyVerticesEdit
     */
    L.Edit.PolyVerticesEdit.include({

        _initMarkers: function () {
            if (!this._markerGroup) {
                this._markerGroup = new L.LayerGroup();
            }
            this._markers = [];

            let latlngs = this._defaultShape(),
                i, j, len, marker;

            for (i = 0, len = latlngs.length; i < len; i++) {
                marker = this._createMarker(latlngs[i], i);
                marker.on('click', this._onMarkerClick, this);
                marker.on('contextmenu', this._onContextMenu, this);
                this._markers.push(marker);
            }

            let markerLeft, markerRight;

            for (i = 0, j = len - 1; i < len; j = i++) {
                if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
                    continue;
                }

                markerLeft = this._markers[j];
                markerRight = this._markers[i];

                if(this._poly.annotationType !== 'angle' && this._poly.annotationType !== 'simple-line')
                    this._createMiddleMarker(markerLeft, markerRight);
                this._updatePrevNext(markerLeft, markerRight);
            }
        }
    });
}

