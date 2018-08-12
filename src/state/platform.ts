import { types, flow, detach } from 'mobx-state-tree';
import { API, headers } from './__config';

export const Platform = types.model('Platform', {
    id: types.identifierNumber,
    name: types.string
});

export const PlatformArray = types.array(Platform);

export const PlatformStore = types
    .model('PlatformStore', {
        searchQuery: types.string,
        searchResults: PlatformArray,
        platforms: PlatformArray
    })
    .views(self => ({
        get searchResultOptions() {
            return self.searchResults.map(item => ({
                label: item.name,
                value: item
            }));
        }
    }))
    .actions(self => ({
        load: () => {
            self.platforms = JSON.parse(
                localStorage.getItem('platforms') || '[]'
            );
        },

        add: (platform: typeof Platform.Type) => {
            self.platforms = [...self.platforms, detach(platform)].sort(
                (a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
            ) as typeof PlatformArray.Type;

            localStorage.setItem('platforms', JSON.stringify(self.platforms));
        },

        remove: (id: number) => {
            self.platforms = self.platforms.filter(
                platform => platform.id !== id
            ) as typeof PlatformArray.Type;

            localStorage.setItem('platforms', JSON.stringify(self.platforms));
        },

        get: (id: number) => {
            return self.platforms.find(platform => platform.id === id);
        },

        search: flow(function*(q: string) {
            self.searchQuery = q;

            const response = yield fetch(
                `${API}/platforms/?search=${q}&fields=id,name`,
                {
                    headers
                }
            );
            const results = yield response.json();

            self.searchResults = results;
        }),

        resetSearch: () => {
            self.searchQuery = '';
            self.searchResults = [] as any;
        }
    }));
