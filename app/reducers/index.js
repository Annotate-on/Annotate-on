// @flow
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import app from './app';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    app
  });
}
