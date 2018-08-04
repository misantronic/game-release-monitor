import * as React from 'react';
import { render } from 'react-dom';
import { App } from './app';

import 'setimmediate';

render(<App />, document.getElementById('app'));
