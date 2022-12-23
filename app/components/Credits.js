import React, {PureComponent} from 'react';
import {Container, Media} from "reactstrap";
import MyPlaceHolderPicture from './pictures/credits/members/Logomuseumtransp.png';
import UMPT from './pictures/credits/members/logotransparentUMTP.png';
import UCA2 from './pictures/credits/members/UCA2_120.png';
import UB from './pictures/credits/members/logoub.png';
import IRD from './pictures/credits/members/logo_IRD_AMAP.png';
import INRA from './pictures/credits/members/Logotype-INRA-transparent.png';
import CNAM from './pictures/credits/members/logo_cnam.png';
import TELA_BOTANICA from './pictures/credits/members/logo_tela_botanica.png';
import AGORALOGIE from './pictures/credits/members/logo transparent agoralogie.png';
import GBIF from './pictures/credits/members/GBIF logo transparent.png';
import CNRS from './pictures/credits/members/cnrs_logo_transparent.png';
import ANR from './pictures/credits/members/logo_ANR_transparent.png';
import PIA from './pictures/credits/members/Logo-PIA-2018_medium.jpg';
import CRS from './pictures/credits/members/logos-CRS-1560431203.png';
import DICEN from './pictures/credits/members/logo-dicen-idf-330.jpg';
import LOBEX from './pictures/credits/members/lobex-logo.png';
import PRESEK from './pictures/credits/members/presek-i_logo.png';
import {shell} from "electron";
import pjson from "../../package";
const REC_LOGO = require('./pictures/annotate-on_logo.jpg');
const CREDIT_IMAGE_CONTEXT = require('./pictures/credit.svg');

export default class Credits extends PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const { t } = this.props;
        return (
            <Container className="bst rcn_credits">
                <div className="bg">
                    <a>
                        <img alt="logo" height="18px" src={CREDIT_IMAGE_CONTEXT} className="logo"/>
                    </a>
                </div>
                <section className="border-bottom">
                    <div className="row justify-content-center -align-center no-margin">
                        <div>
                            <a onClick={ () =>
                                shell.openExternal(
                                    `https://www.recolnat.org`
                                )
                            }>
                                <div className="logoContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                     <img src={REC_LOGO} className="logo-on"/>
                                    <span className="version">{pjson.version}</span>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div className="row justify-content-center -align-center no-margin">
                        <span className="citation">{t('credits.lbl_citation')}: RECOLNAT-ANR-11-INBS-0004</span>
                    </div>
                    <div className="social-media-div">
                        <br/>
                        <i className="fa fa-4x fa-twitter tw-icon" aria-hidden="true"
                           onClick={ () => shell.openExternal('https://twitter.com/Annotate4images')}
                        />
                        <p onClick={ () => shell.openExternal('https://twitter.com/Annotate4images')}>
                            @Annotate4images
                        </p>
                    </div>
                </section>

                <section className="border-bottom">
                    <div className="row justify-content-center -align-center no-margin members-row">
                        <div className="row -align-center justify-content-center">
                            <h5 className="members-title">{t('credits.lbl_recolnats_members')}</h5>
                        </div>
                        <div className="row -align-center justify-content-center">

                            <div className="creditsCard">
                                <a onClick={ () =>
                                    shell.openExternal(
                                        `https://www.mnhn.fr`
                                    )
                                }>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={MyPlaceHolderPicture} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>

                            <div className="creditsCard">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `https://www.umontpellier.fr`
                                    )}>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={UMPT} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>

                            <div className="creditsCard">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `http://www.clermont-universite.fr`
                                    )}>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={UCA2} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>

                            <div className="creditsCard">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `http://www.u-bourgogne.fr`
                                    )}>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={UB} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>

                            <div className="creditsCard">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `https://www.ird.fr`
                                    )}>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={IRD} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>

                            <div className="creditsCard">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `http://collections.antilles.inra.fr`
                                    )}>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={INRA} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>

                            <div className="creditsCard">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `http://www.cnam.fr`
                                    )}>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={CNAM} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center -align-center no-margin row-two">
                        <div className="creditsCard">
                            <a onClick={() =>
                                shell.openExternal(
                                    `https://www.tela-botanica.org`
                                )}>
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={TELA_BOTANICA} className="imageMedia"/>
                                </div>
                            </a>
                        </div>

                        <div className="creditsCard">
                            <a onClick={() =>
                                shell.openExternal(
                                    `http://www.agoralogie.fr/`
                                )}>
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={AGORALOGIE} className="imageMedia"/>
                                </div>
                            </a>
                        </div>

                        <div className="creditsCard">
                            <a onClick={() =>
                                shell.openExternal(
                                    `https://www.gbif.org`
                                )}>
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={GBIF} className="imageMedia"/>
                                </div>
                            </a>
                        </div>

                        <div className="creditsCard">
                            <a onClick={ () =>
                                shell.openExternal(
                                    `http://www.cnrs.fr`
                                )}>
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={CNRS} className="imageMedia"/>
                                </div>
                            </a>
                        </div>

                        <div className="creditsCard">
                            <a onClick={() =>
                                shell.openExternal(
                                    `https://anr.fr`
                                )}>
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={ANR} className="imageMedia"/>
                                </div>
                            </a>
                        </div>

                        <div className="creditsCard">
                            <a onClick={() =>
                                shell.openExternal(
                                    `https://www.gouvernement.fr/secretariat-general-pour-l-investissement-sgpi`
                                )}
                            >
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={PIA} className="imageMedia"/>
                                </div>
                            </a>
                        </div>

                        <div className="creditsCard">
                            <a onClick={() =>
                                shell.openExternal(
                                    `http://cerese.univ-lyon1.fr/`
                                )}>
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={CRS} className="imageMedia"/>
                                </div>
                            </a>
                        </div>
                        <div className="row justify-content-center -align-center read-more-div">
                            <span>{t('credits.lbl_and_65_partners_institutions')}</span>
                            <span className="btn-link inline-link"
                                  color="primary">
                                    <a title={t('global.open_link_in_external_browser')}
                                       onClick={() => shell.openExternal('https://www.recolnat.org/en/nos-partenaires')}>{t('credits.lbl_read_more')}</a>
                                </span>

                        </div>
                    </div>
                </section>

                <section className="border-bottom dicen-section">
                    <div className="row justify-content-center -align-center no-margin">
                        <div className="row justify-content-center -align-center dc-title">
                            <h5>{t('credits.lbl_created_by')}</h5>
                        </div>
                        <br/>
                        <br/>
                        <div className="row justify-content-center -align-center dc-title">
                            <p className="opahText">
                                <span>{t('credits.lbl_event_and_video_parts_created_by')}</span>
                                <span className="btn-link inline-link"
                                      color="primary">
                                    <a title={t('global.open_link_in_external_browser')}
                                       onClick={ () => shell.openExternal('https://www.dicen-idf.org/projet-recherche-opahh-iiif/')}>OPAHH-IIIF</a>
                                </span>
                                <span>{t('credits.lbl_from')}</span>
                                <span className="btn-link inline-link"
                                      color="primary">
                                    <a title={t('global.open_link_in_external_browser')}
                                       onClick={ () => shell.openExternal('http://passes-present.eu')}> Labex Les passés dans le présent</a>
                                </span>
                            </p>
                        </div>
                        <div className="row justify-content-center -align-center dc-title iiif-title">
                            <b>OPAHH iiif project</b>
                        </div>
                        <br/>
                        <br/>
                        <div className="row justify-content-center -align-center full-width">
                            <div className="dicen-logo">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `http://passes-present.eu/`
                                    )}>
                                    <div className="lobex-imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={LOBEX} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div className="row justify-content-center -align-center full-width">
                            <div className="dicen-logo">
                                <a onClick={() =>
                                    shell.openExternal(
                                        `https://www.dicen-idf.org`
                                    )}>
                                    <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                         title={t('global.open_link_in_external_browser')}>
                                        <Media src={DICEN} className="imageMedia"/>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
                <section>
                    <div className="row justify-content-center -align-center no-margin">
                        <div className="row justify-content-center -align-center presek-div">
                            <h5>{t('credits.lbl_software_development')}</h5>
                        </div>
                        <div className="presek-logo">
                            <a onClick={ () =>
                                shell.openExternal(
                                    `https://www.presek-i.com`
                                )}>
                                <div className="imageContainer" data-toggle="tooltip" data-placement="top"
                                     title={t('global.open_link_in_external_browser')}>
                                    <Media src={PRESEK} className="imageMedia"/>
                                </div>
                            </a>
                        </div>
                    </div>
                </section>

            </Container>
        );
    }
}
