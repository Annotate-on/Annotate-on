import React from 'react';
import styled from 'styled-components';

const _Nothing = styled.div`
  font-size: 200%;
  height: 100%;
  padding: 100px;
  text-align: center;
  width: 100%;
`;

export const Nothing = ({ message }) => <_Nothing>{message}</_Nothing>;

export default Nothing;
