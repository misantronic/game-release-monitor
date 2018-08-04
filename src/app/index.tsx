import { bindAll } from 'lodash-decorators';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Platforms } from '../platforms';
import { Games } from '../games';
import { AppStore } from '../state/app';
import { Platform } from '../state/platform';

@bindAll()
@observer
export class App extends React.Component {
    private store = AppStore.create();

    public render(): React.ReactNode {
        const { selectedPlatform } = this.store;

        return (
            <div>
                <h1>Release monitor</h1>
                <div className="container">
                    <Platforms onSelect={this.onSelect} />
                    {selectedPlatform && <Games platform={selectedPlatform} />}
                </div>
            </div>
        );
    }

    private onSelect(platform?: typeof Platform.Type): void {
        this.store.setSelectedPlatform(platform);
    }
}
