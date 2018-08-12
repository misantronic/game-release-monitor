import { types } from 'mobx-state-tree';
import { Platform } from './platform';

export const AppStore = types
    .model('AppStore', {
        selectedPlatform: types.maybe(Platform)
    })
    .views(() => ({
        getPlatformIdFromHash: () => {
            const id = parseInt(location.hash.substr(1));

            if (!isNaN(id)) {
                return id;
            }

            return null;
        }
    }))
    .actions(self => ({
        loadPlatform: (id: number) => {
            const platforms = JSON.parse(
                localStorage.getItem('platforms') || '[]'
            ) as (typeof Platform.Type)[];

            return platforms.find(platform => platform.id === id);
        },

        setSelectedPlatform: (platform?: typeof Platform.Type) => {
            self.selectedPlatform = platform;

            if (platform) {
                location.hash = String(platform.id);
            }
        }
    }));
