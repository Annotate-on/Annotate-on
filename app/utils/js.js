import moment from 'moment';
import request from "request";
import {Pagination, PaginationItem, PaginationLink} from "reactstrap";
import React from "react";
import {PATH_ESCAPE, RESOURCE_TYPE_PICTURE} from "../constants/constants";

export const arrayToIndex = (a, p) => {
    const res = {};
    for (const item of a) {
        res[item[p]] = item;
    }
    return res;
};

export const formatValue = (val, decimals) => {
    if (val)
        return val.toFixed(decimals);
    else return 0;
};

export const formatDate = date => {
    return moment(date).format('YYYY.MM.DD HH[h]mm[m]ss[s]SSS[ms]');
};

export const formatDateForFileName = date => {
    return moment(date).format('YYYY-MM-DD HH[h]mm[m]ss[s]');
};

export const _checkImageType = (image) =>{

    let isImage;

    if (image.resourceType && image.resourceType === RESOURCE_TYPE_PICTURE){
        isImage = true;
    }
    else isImage = image.type && image.type === 'image';

    return isImage;
}

export const findLongestStringInArrayOfArrays = (data, propertyIndex) => {
    let res = 0;

    for (let datum of data) {
        let s = datum[propertyIndex];
        if (s) {
            if (typeof s !== 'string') {
                s = s.toString();
            }
            if (s.length > res) {
                res = s.length;
            }
        }
    }

    return res;
};

export const get = (url, outputString) => {
    return new Promise((resolve, reject) => {
        let body = [];
        request(url, {timeout: 30000, proxy: process.env.RECOLNAT_HTTP_PROXY}).on('data', (chunk) => {
            body.push(chunk);
        })
            .on('error', err => reject(err))
            .on('end', () => {
                try {
                    let resp;
                    if (outputString)
                        resp = Buffer.concat(body).toString();
                    else
                        resp = JSON.parse(Buffer.concat(body).toString());
                    resolve(resp)
                } catch (err) {
                    console.log(err);
                    reject(err);
                }
            });
    });
};

export const createPagination = (name, list, currentPage, pageSize, setState) => {
    const totalPages = Math.ceil(list.length / pageSize);
    const pages = [];

    if (totalPages > 10) {
        pages.push(<PaginationItem key={'first'}>
            <PaginationLink first onClick={() => {
                setState({currentPage: 1})
            }}/>
        </PaginationItem>)

        let modifierEnd = 5;
        let modifierStart = 5;
        if(currentPage <= 5) {
            modifierEnd = 11 - currentPage;
        }
        if(totalPages - currentPage < 5) {
            modifierStart = 9 - (totalPages - currentPage)
        }

        for (let i = (currentPage - modifierStart); i < currentPage + modifierEnd; i++) {
            if (i <= 0 || i > totalPages) {
                continue
            }
            const active = currentPage === i ? 'active' : 'inactive'
            pages.push(<PaginationItem className={active} key={i}>
                <PaginationLink onClick={() => {
                    setState({currentPage: i})
                }}>{i}</PaginationLink>
            </PaginationItem>);
        }

        pages.push(<PaginationItem key={'last'}>
            <PaginationLink last onClick={() => {
                setState({currentPage: totalPages})
            }}/>
        </PaginationItem>)
    } else {
        for (let i = 1; i <= totalPages; i++) {
            const active = currentPage === i ? 'active' : 'inactive'
            pages.push(<PaginationItem className={active} key={i}>
                <PaginationLink onClick={() => {
                    setState({currentPage: i})
                }}>{i}</PaginationLink>
            </PaginationItem>);
        }
    }
    return [<Pagination key={name} size='md' className='center_pager'>{pages}</Pagination>];
}

export const escapePathString = (path) => {
    return path.replace(PATH_ESCAPE, '/')
}

export const containsSpecialCharacters = (value) => {
    const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    return format.test(value);
}
