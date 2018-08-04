import { types } from 'mobx-state-tree';
import { Platform } from './platform';

export const AppStore = types
    .model('AppStore', {
        selectedPlatform: types.maybe(types.reference(Platform))
    })
    .actions(self => ({
        setSelectedPlatform: (platform?: typeof Platform.Type) => {
            self.selectedPlatform = platform;
        }
    }));
