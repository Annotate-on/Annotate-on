import fs from 'fs-extra';
import path from 'path';
import {convertGpsToLatLng} from "./maths";
import {formatXmpDate} from "./library";

export const getMetadata = _ => {
  const baseNameWithoutExtension = path.basename(_, path.extname(_));
  const jsonFilePath = path.join(path.dirname(_), `${baseNameWithoutExtension}.json`);
  if (fs.existsSync(jsonFilePath)) {
    const metadata = fs.readFileSync(jsonFilePath, 'utf8');
    return JSON.parse(metadata);
  }
  return undefined;
};

export const getXmpMetadata = exif => {

  let exifMetadata = {};

  exifMetadata.title =
      exif && exif.hasOwnProperty('Object Name')
          ? exif['Object Name'].description
          : '';

  exifMetadata.creator =
      exif && exif.hasOwnProperty('By-line')
          ? exif['By-line'].description
          : '';

  exifMetadata.rights =
      exif && exif.hasOwnProperty('Copyright Notice')
          ? exif['Copyright Notice'].description
          : '';

  exifMetadata.description =
      exif && exif.hasOwnProperty('Caption/Abstract')
          ? exif['Caption/Abstract'].description
          : '';

  let subject = '';
  if (exif && exif.hasOwnProperty('Keywords')) {

    const keywords = exif.Keywords;

    if (typeof keywords === 'object' && keywords !== null ) {
      subject = keywords.description;
    }

    if (Array.isArray(keywords)) {
      keywords.forEach( word => {
        subject = subject + word.description + ';';
      });
      subject = subject.replace(/;\s*$/, "");
    }
  }

  exifMetadata.subject = subject;

  exifMetadata.type = 'image';

  exifMetadata.format =
      exif && exif.hasOwnProperty('format')
          ? exif.format.value
          : 'jpg';

  exifMetadata.exifDate = null;
  if (exif && exif.hasOwnProperty('DateTimeOriginal') && exif.DateTimeOriginal.description !== null) {
    exifMetadata.exifDate = formatXmpDate(exif.DateTimeOriginal.description);
  }

  exifMetadata.exifPlace = '';
  if (exif && exif.hasOwnProperty('gps')) {
    exifMetadata.exifPlace = convertGpsToLatLng(exif.gps);
  }

  if (exif && exif.hasOwnProperty('GPSLatitude') && exif.hasOwnProperty('GPSLongitude')
      && exif.hasOwnProperty('GPSLatitudeRef') && exif.hasOwnProperty('GPSLongitudeRef')) {

    const gps = {};
    gps.GPSLatitude = exif.GPSLatitude.value;
    gps.GPSLongitude = exif.GPSLongitude.value;
    gps.GPSLatitudeRef = exif.GPSLatitudeRef.value;
    gps.GPSLongitudeRef = exif.GPSLongitudeRef.value;

    exifMetadata.exifPlace = convertGpsToLatLng(gps);
  }

    if (exif.hasOwnProperty('recolnat_catalogNumber')) {
      exifMetadata.catalogNumber = exif.recolnat_catalogNumber.description;
    }
    if (exif.hasOwnProperty('recolnat_reference')) {
      exifMetadata.reference = exif.recolnat_reference.description;
    }
    if (exif.hasOwnProperty('recolnat_family')) {
      exifMetadata.family = exif.recolnat_family.description;
    }
    if (exif.hasOwnProperty('recolnat_genre')) {
      exifMetadata.genre = exif.recolnat_genre.description;
    }
    if (exif.hasOwnProperty('recolnat_sfName')) {
      exifMetadata.sfName = exif.recolnat_sfName.description
    }
    if (exif.hasOwnProperty('recolnat_fieldNumber')) {
      exifMetadata.fieldNumber = exif.recolnat_fieldNumber.description;
    }
    if (exif.hasOwnProperty('dc_title')) {
      exifMetadata.title = exif.dc_title.description;
    }
    if (exif.hasOwnProperty('dc_creator')) {
      exifMetadata.creator = exif.dc_creator.description;
    }
    if (exif.hasOwnProperty('Model')) {
      exifMetadata.model = exif.Model.description;
    }
    if (exif.hasOwnProperty('Make')) {
      exifMetadata.make = exif.Make.description;
    }
    if (exif.hasOwnProperty('dc_subject')) {
      exifMetadata.subject = exif.dc_subject.description;
    }
    if (exif.hasOwnProperty('dc_description')) {
      exifMetadata.description = exif.dc_description.description;
    }
    if (exif.hasOwnProperty('dc_publisher')) {
      exifMetadata.publisher = exif.dc_publisher.description;
    }
    if (exif.hasOwnProperty('dc_contributor')) {
      exifMetadata.contributor = exif.dc_contributor.description;
    }
    if (exif.hasOwnProperty('dc_created')) {
      exifMetadata.exifDate = exif.dc_created.description;
    }
    if (exif.hasOwnProperty('dc_type')) {
      exifMetadata.type = exif.dc_type.description;
    }
    if (exif.hasOwnProperty('dc_format')) {
      exifMetadata.format = exif.dc_format.description;
    }
    if (exif.hasOwnProperty('dc_identifier')) {
      exifMetadata.identifier = exif.dc_identifier.description;
    }
    if (exif.hasOwnProperty('dc_source')) {
      exifMetadata.source = exif.dc_source.description;
    }
    if (exif.hasOwnProperty('dc_language')) {
      exifMetadata.language = exif.dc_language.description;
    }
    if (exif.hasOwnProperty('dc_relation')) {
      exifMetadata.relation = exif.dc_relation.description;
    }
    if (exif.hasOwnProperty('dc_coverage')) {
      exifMetadata.exifPlace = exif.dc_coverage.description;
    }
    if (exif.hasOwnProperty('dc_contact')) {
      exifMetadata.contact = exif.dc_contact.description;
    }
    if (exif.hasOwnProperty('dc_rights')) {
      exifMetadata.rights = exif.dc_rights.description;
    }
    if (exif.hasOwnProperty('Orientation')) {
      exifMetadata.orientation = calculateOrientation(exif.Orientation.value);
    }
    if (exif.hasOwnProperty('Orientation')) {
    exifMetadata.orientation = calculateOrientation(exif.Orientation.value);
    }
    if (exif.hasOwnProperty('DateTimeOriginal')) {

      let year = '';
      let date = exif.DateTimeOriginal.description.split(/[\s:]+/);
          date.forEach( s => {
              if ( s.length === 4) {
                year = s;
                return false;
              }else{
                return  true;
              }
          });

      exifMetadata.yearCreated = year;
    }


    return exifMetadata;
};

export const METADATA_TITLES = {
  basisofrecord: 'Basis of Record',
  catalognumber: 'Catalog Number',
  collectioncode: 'Collection Code',
  collectionid: 'Collection ID',
  collectionname: 'Collection Name',
  dwcaid: 'DWCA ID',
  family: 'Family',
  genus: 'Genus',
  institutioncode: 'Institution Code',
  institutionid: 'Institution ID',
  institutionname: 'Institution Name',
  modified: 'Modified',
  scientificname: 'Scientific Name',
  specificepithet: 'Specific Epithet',
  determinations: 'Determinations',
  recordedby: 'Collector name',
  fieldnumber: 'Collect number',
  eventdate: 'Date of collect',
  decimallatitude: 'Latitude',
  decimallongitude: 'Longitude'
};

export const METADATA_DETERMINATIONS_TITLES = {
  created: 'Created',
  family: 'Family',
  genus: 'Genus',
  higherclassification: 'Higher Classification',
  identificationverificationstatus: 'Identification Verification Status',
  modified: 'Modified',
  scientificname: 'Scientific Name',
  scientificnameauthorship: 'Scientific Name Authorship',
  specificepithet: 'Specific Epithet',
  taxonid: 'Taxon ID'
};


const calculateOrientation = ( value)  => {

  let result;

  switch (value) {
    case 1:
      result = '';
      break;
    case 2:
      result = '-flip horizontal';
      break;
    case 3:
      result = '-rotate 180';
      break;
    case 4:
      result = '-flip vertical';
      break;
    case 5:
      result = '-transpose';
      break;
    case 6:
      result = '-rotate 90';
      break;
    case 7:
      result = '-transverse';
      break;
    case 8:
      result = '-rotate 270';
      break;
    default:
      result = '';
      break;
  }
  return result;



 };
