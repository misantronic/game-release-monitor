import { types, flow, detach } from 'mobx-state-tree';
import { Platform } from './platform';

export const ReleaseDate = types.model('ReleaseDate', {
    category: types.maybe(types.number),
    date: types.maybe(types.number),
    human: types.maybe(types.string),
    m: types.maybe(types.number),
    platform: types.maybe(types.number),
    region: types.maybe(types.number),
    y: types.maybe(types.number)
});

export const Cover = types.model('Cover', {
    cloudinary_id: types.string,
    url: types.string,
    width: types.number,
    height: types.number
});

export const Website = types.model('Website', {
    category: types.number,
    url: types.string
});

export const Game = types.model('Game', {
    id: types.identifierNumber,
    name: types.string,
    release_dates: types.array(ReleaseDate),
    cover: types.maybe(Cover),
    summary: types.maybe(types.string),
    websites: types.maybe(types.array(Website))
});

export const GameTypeModel = types.array(types.number);

const sortGames = (a: typeof Game.Type, b: typeof Game.Type) =>
    (a.release_dates[0].date || 0) - (b.release_dates[0].date || 0);

export const GamesStore = types
    .model('GamesStore', {
        searchQuery: types.string,
        searchResults: types.array(Game),
        searchLoading: types.boolean,
        games: types.array(Game),
        gamesLoading: types.boolean
    })
    .views(self => ({
        firstReleaseDate(game: typeof Game.Type, platform: number) {
            if (game.release_dates) {
                const item = game.release_dates.find(
                    item => item.platform === platform
                );

                if (item) {
                    return item.human;
                }
            }

            return null;
        },

        firstWebsite(game: typeof Game.Type) {
            if (game.websites) {
                return game.websites[0].url;
            }

            return null;
        },

        get searchResultOptions() {
            return self.searchResults.map(game => ({
                label: game.name,
                value: game
            }));
        }
    }))
    .actions(self => ({
        load: flow(function*(platformId: number) {
            const storage = JSON.parse(
                localStorage.getItem('games') || '[]'
            ) as [number, number][];

            self.gamesLoading = true;
            self.games = [] as any;

            yield Promise.all(
                storage.filter(([p]) => p === platformId).map(
                    flow(function*([_, gameId]) {
                        const response = yield fetch(
                            `http://cors-anywhere.herokuapp.com/https://api-endpoint.igdb.com/games/${gameId}?filter[release_dates.platform][eq]=${platformId}&fields=id,name,release_dates,cover,summary,websites`,
                            {
                                headers: {
                                    'user-key':
                                        '38e54e90206e216b13e77800b4b4d40d',
                                    Accept: 'application/json'
                                }
                            }
                        );

                        const game = (yield response.json())[0];

                        self.games = [...self.games, game].sort(
                            sortGames
                        ) as any;
                    })
                )
            );

            self.gamesLoading = false;
        }),

        add: (game: typeof Game.Type, platform: typeof Platform.Type) => {
            // @ts-ignore
            self.games = [...self.games, detach(game)].sort(sortGames);

            const storage = JSON.parse(localStorage.getItem('games') || '[]');

            localStorage.setItem(
                'games',
                JSON.stringify([...storage, [platform.id, game.id]])
            );
        },

        remove: (id: number) => {
            // @ts-ignore
            self.games = self.games.filter(item => item.id !== id);

            const storage = JSON.parse(localStorage.getItem('games') || '[]');

            localStorage.setItem(
                'games',
                JSON.stringify(storage.filter(([_, gameId]) => gameId !== id))
            );
        },

        search: flow(function*(q: string, platformId: number) {
            self.searchQuery = q;
            self.searchLoading = true;
            self.searchResults = [] as any;

            const response = yield fetch(
                `http://cors-anywhere.herokuapp.com/https://api-endpoint.igdb.com/games/?search=${q}&filter[release_dates.platform][eq]=${platformId}&fields=id,name,release_dates,cover,summary`,
                {
                    headers: {
                        'user-key': '38e54e90206e216b13e77800b4b4d40d',
                        Accept: 'application/json'
                    }
                }
            );

            self.searchResults = yield response.json();
            self.searchLoading = false;
        }),

        resetSearch: () => {
            self.searchQuery = '';
            self.searchResults = [] as any;
        }
    }));
