import parser from 'fast-xml-parser';
import fs from 'fs-extra';
import {JSONPath} from 'jsonpath-plus';
import {CATEGORICAL, NUMERICAL} from "../constants/constants";
import Chance from 'chance';
import lodash from 'lodash';
import {formatValue} from "./js";

const change = new Chance();

export const convertSDDtoJson = (sddUrl) => {
    const response = {
        id: '',
        name: '',
        groups: [],
        items: []
    };
    const options = {
        attributeNamePrefix: "",
        textNodeName: "#text",
        ignoreAttributes: false,
        ignoreNameSpace: false,
        allowBooleanAttributes: false,
        parseNodeValue: true,
        parseAttributeValue: false,
        trimValues: true,
        cdataTagName: "__cdata", //default is 'false'
        cdataPositionChar: "\\c",
        localeRange: "", //To support non english character in tag/attribute values.
        parseTrueNumberOnly: false
    };

    const tObj = parser.getTraversalObj(fs.readFileSync(sddUrl).toString(), options);
    const jsonObj = parser.convertToJson(tObj, options);
    const dataSet = jsonObj['Datasets']['Dataset'];

    response.name = dataSet['Representation']['Label'];

    const descriptiveConcepts = JSONPath({flatten: true}, '$..DescriptiveConcepts.DescriptiveConcept', dataSet, null, null);
    const nodes = JSONPath({flatten: true}, '$..CharacterTree[?(@.ShouldContainAllCharacters===undefined)]', dataSet, null, null);
    const quantitativeCharacter = dataSet['Characters']['QuantitativeCharacter'];
    const categoricalCharacter = dataSet['Characters']['CategoricalCharacter'];
    const innerNodes = nodes[0]['Nodes'];


    response.groups = descriptiveConcepts;

    const createStructure = (node, connNode) => {


        // `items : [
        // {
        //     id: '',
        //     annotationType: 'CATEGORICAL|NUMERICAL'
        //     targetType: '',
        //     targetName: '',
        //     unit: '',
        //     targetColor: '#333',
        //     states: [
        //         {
        //             id: '',
        //             name: '',
        //          }
        //     ]
        // }]`

        const item = {};
        if (node.hasOwnProperty('Parent')) {
            const tmpNode = connNode.find(n => n['id'] === node['Parent']['ref']);
            const dc = descriptiveConcepts.find(dct => dct['id'] === tmpNode['DescriptiveConcept']['ref']);
            if (dc)
                item.targetType = dc['Representation']['Label'];
        }
        if (quantitativeCharacter) {
            const char = Array.isArray(quantitativeCharacter) ?
                quantitativeCharacter.find(character => character['id'] === node['Character']['ref']) :
                (quantitativeCharacter['id'] === node['Character']['ref'] ? quantitativeCharacter : undefined);
            if (char) {
                item.targetName = char['Representation']['Label'];
                if(!lodash.isObject(char['MeasurementUnit']['Label'])) {
                    item.unit = char['MeasurementUnit']['Label'];
                } else {
                    item.unit = char['MeasurementUnit']['Label']['#text'];
                }
                item.annotationType = NUMERICAL;
                item.id = char['id'];
                item.targetColor = '#ff0000';
            }
        }
        if (categoricalCharacter) {
            const char = Array.isArray(categoricalCharacter) ?
                categoricalCharacter.find(character => character['id'] === node['Character']['ref']) :
                (categoricalCharacter['id'] === node['Character']['ref'] ? categoricalCharacter : undefined);
            if (char) {
                item.targetName = char['Representation']['Label'];
                item.annotationType = CATEGORICAL;
                item.id = char['id'];
                item.targetColor = '#ff0000';
                item.states = [];
                if (char['States']['StateDefinition']) {
                    char['States']['StateDefinition'].map(state => {
                        item.states.push({
                            id: state['id'],
                            name: state['Representation']['Label']
                        });
                    });
                }
            }
        }
        response.items.push(item);
    };

    const connNode = innerNodes['Node'];
    const charNode = innerNodes['CharNode'];



    Array.isArray(charNode) ? charNode.map(node => createStructure(node, connNode)) : createStructure(charNode, connNode);
    return response;
};

export const convertJsonToSDD = (sourceSdd, destinationSdd, taxonomyInstance, selectedTaxonomy, pictures) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fs.readFileSync(sourceSdd).toString(), "text/xml");
    const taxoName = xmlDoc.getElementsByTagName("TaxonNames")[0];
    const nodes = xmlDoc.getElementsByTagName("Nodes")[0];
    const codedDescriptions = xmlDoc.getElementsByTagName("CodedDescriptions")[0];
    if (taxoName) {
        if (taxonomyInstance.taxonomyByPicture) {
            let picIndex = 1;
            for (const sha1 in taxonomyInstance.taxonomyByPicture) {
                const picture = pictures[sha1];
                const catalogNumber = picture.erecolnatMetadata && picture.erecolnatMetadata.catalognumber ?
                    picture.erecolnatMetadata.catalognumber : picture.file_basename;
                const tId = `t${picIndex}`;

                taxoName.appendChild(createTaxonName(tId, catalogNumber, null, xmlDoc));
                nodes.appendChild(createNode(tId, xmlDoc, picIndex));

                const codedDescription = xmlDoc.createElement("CodedDescription");
                codedDescription.setAttribute("id", `D${picIndex}`);
                codedDescription.appendChild(createRepresentation(catalogNumber, null, xmlDoc));

                const scope = xmlDoc.createElement("Scope");
                const taxonName = xmlDoc.createElement("TaxonName");
                taxonName.setAttribute("id", tId);
                scope.appendChild(taxonName);
                codedDescription.appendChild(scope);
                codedDescriptions.appendChild(codedDescription);

                const summaryData = xmlDoc.createElement("SummaryData");
                codedDescription.appendChild(summaryData);

                const picTaxonomies = taxonomyInstance.taxonomyByPicture[sha1];
                for (const descriptorId in picTaxonomies) {
                    const descriptor = picTaxonomies[descriptorId];

                    const annotationType = selectedTaxonomy.descriptors.find(_ => _.id === descriptorId).annotationType;
                    if (annotationType === NUMERICAL) {
                        const quantitative = xmlDoc.createElement("Quantitative");
                        quantitative.setAttribute("ref", descriptorId);
                        summaryData.appendChild(quantitative);

                        const ratings = xmlDoc.createElement("Ratings");
                        quantitative.appendChild(ratings);

                        const rating = xmlDoc.createElement("Rating");
                        rating.setAttribute("context", "ObservationConvenience");
                        rating.setAttribute("rating", "Rating3of5");
                        ratings.appendChild(rating);

                        const measureMax = xmlDoc.createElement("Measure");
                        measureMax.setAttribute("type", "Max");
                        measureMax.setAttribute("value", descriptor.max.toFixed(7));
                        quantitative.appendChild(measureMax);

                        const measureMin = xmlDoc.createElement("Measure");
                        measureMin.setAttribute("type", "Min");
                        measureMin.setAttribute("value", descriptor.min.toFixed(7));
                        quantitative.appendChild(measureMin);

                        const measureMean = xmlDoc.createElement("Measure");
                        measureMean.setAttribute("type", "Mean");
                        measureMean.setAttribute("value", formatValue(descriptor.avg,7));
                        quantitative.appendChild(measureMean);

                        const measureSD = xmlDoc.createElement("Measure");
                        measureSD.setAttribute("type", "SD");
                        measureSD.setAttribute("value", descriptor.sd.toFixed(7));
                        quantitative.appendChild(measureSD);
                    } else if (annotationType === CATEGORICAL) {
                        /*
                        <Categorical ref="c5">
                            <Ratings>
                                <Rating context="ObservationConvenience" rating="Rating3of5" />
                            </Ratings>
                            <State ref="s1" />
                            <State ref="s2" />
                        </Categorical>
                         */
                        const categorical = xmlDoc.createElement("Categorical");
                        categorical.setAttribute("ref", descriptorId);
                        summaryData.appendChild(categorical);

                        const ratings = xmlDoc.createElement("Ratings");
                        categorical.appendChild(ratings);

                        const rating = xmlDoc.createElement("Rating");
                        rating.setAttribute("context", "ObservationConvenience");
                        rating.setAttribute("rating", "Rating3of5");
                        ratings.appendChild(rating);

                        descriptor.value.map(st => {
                            if(st === 'DataUnavailable') {
                                const status = xmlDoc.createElement("Status");
                                status.setAttribute("code", st);
                                categorical.appendChild(status);
                            } else {
                                const state = xmlDoc.createElement("State");
                                state.setAttribute("ref", st);
                                categorical.appendChild(state);
                            }
                        })
                    }
                }
                picIndex++;
            }
        }

        // https://recolnat.atlassian.net/jira/software/c/projects/AO/issues/AO-35
        // const getDescriptions = xmlDoc.getElementsByTagName("CodedDescriptions")[0];
        //     if (getDescriptions.childElementCount > 1) {
        //     const descToDelete = getDescriptions.getElementsByTagName("CodedDescription")[0];
        //     getDescriptions.removeChild(descToDelete);
        // }
        //
        // const getTaxonNames = xmlDoc.getElementsByTagName("TaxonNames")[0];
        // if (getTaxonNames.childElementCount > 1) {
        //     const taxonToDelete = getTaxonNames.getElementsByTagName("TaxonName")[0];
        //     getTaxonNames.removeChild(taxonToDelete);
        // }

        fs.writeFileSync(destinationSdd, (new XMLSerializer()).serializeToString(xmlDoc));
    } else {
        console.log('TaxonNames node is not present.')
    }
};

/*
    <TaxonName id="t1" uniqueid="slika_1232_1564137743349_827">
        <Representation>
          <Label>slika_123234</Label>
          <Detail>_</Detail>
        </Representation>
      </TaxonName>
 */
const createTaxonName = (id, name, details, xmlDoc) => {
    const taxonName = xmlDoc.createElement("TaxonName");
    taxonName.setAttribute("id", id);
    taxonName.setAttribute("uniqueid", chance.hash());

    taxonName.appendChild(createRepresentation(name, details, xmlDoc));
    return taxonName;
};

const createRepresentation = (name, details, xmlDoc) => {
    const representation = xmlDoc.createElement("Representation");
    const label = xmlDoc.createElement("Label");
    const detail = xmlDoc.createElement("Detail");

    label.textContent = name;
    detail.textContent = details || '_';

    representation.appendChild(label);
    representation.appendChild(detail);

    return representation;
};

/*
      <Nodes>
        <Node id="tn1">
          <TaxonName ref="t1" />
        </Node>
        <Node id="tn2">
          <TaxonName ref="t2" />
        </Node>
      </Nodes>
 */
const createNode = (tId, xmlDoc, index) => {
    const node = xmlDoc.createElement("Node");
    const taxonName = xmlDoc.createElement("TaxonName");
    node.setAttribute("id", `tn${index}`);
    taxonName.setAttribute("ref", tId);
    node.appendChild(taxonName);
    return node;
}
