import { types, flow, detach } from 'mobx-state-tree';
import { Platform } from './platform';
import { API, headers } from './__config';

const fields = [
    'id',
    'name',
    'release_dates',
    'cover',
    'summary',
    'websites',
    'screenshots'
];

type ImageType =
    | 't_cover_small'
    | 't_screenshot_med'
    | 't_cover_big'
    | 't_logo_med'
    | 't_screenshot_big'
    | 't_screenshot_huge'
    | 't_thumb'
    | 't_micro'
    | 't_720p'
    | 't_1080p';

export const ReleaseDate = types.model('ReleaseDate', {
    category: types.maybe(types.number),
    date: types.maybe(types.number),
    human: types.maybe(types.string),
    m: types.maybe(types.number),
    platform: types.maybe(types.number),
    region: types.maybe(types.number),
    y: types.maybe(types.number)
});

export const Image = types.model('Image', {
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
    cover: types.maybe(Image),
    summary: types.maybe(types.string),
    websites: types.maybe(types.array(Website)),
    screenshots: types.maybe(types.array(Image))
});

export const GameTypeModel = types.array(types.number);

const sortGames = (a: typeof Game.Type, b: typeof Game.Type) =>
    (a.release_dates[0].date || 0) - (b.release_dates[0].date || 0);

export const GamesStore = types
    .model('GamesStore', {
        searchQuery: types.maybe(types.string),
        searchResults: types.array(Game),
        searchLoading: types.maybe(types.boolean),
        games: types.array(Game),
        gamesLoading: types.maybe(types.boolean),
        gameExpanded: types.maybe(types.number)
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

        getImage(id: string, type: ImageType = 't_cover_big') {
            // prettier-ignore
            return `https://images.igdb.com/igdb/image/upload/${type}/${id}.jpg`
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
                            // prettier-ignore
                            `${API}/games/${gameId}?filter[release_dates.platform][eq]=${platformId}&fields=${fields.join(',')}`,
                            { headers }
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
                // prettier-ignore
                `${API}/games/?search=${q}&filter[release_dates.platform][eq]=${platformId}&fields=${fields.join(',')}`,
                { headers }
            );

            self.searchResults = yield response.json();
            self.searchLoading = false;
        }),

        resetSearch: () => {
            self.searchQuery = '';
            self.searchResults = [] as any;
        },

        expandGame: (gameId?: number) => {
            if (self.gameExpanded === gameId) {
                self.gameExpanded = undefined;
            } else {
                self.gameExpanded = gameId;
            }
        }
    }));
