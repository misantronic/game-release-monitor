import * as React from 'react';
import { bindAll, debounce } from 'lodash-decorators';
import { observer } from 'mobx-react';
import { Select } from 'react-slct';
import { Game, GamesStore } from '../state/game';
import { Platform } from '../state/platform';

interface GamesProps {
    platform: typeof Platform.Type;
}

@bindAll()
@observer
export class Games extends React.Component<GamesProps> {
    private store = GamesStore.create({
        searchQuery: '',
        searchLoading: false,
        searchResults: [],
        gamesLoading: false
    });

    public componentDidMount() {
        this.store.load(this.props.platform.id);
    }

    public componentDidUpdate(prevProps: GamesProps) {
        if (prevProps.platform !== this.props.platform) {
            this.store.load(this.props.platform.id);
        }
    }

    public render(): React.ReactNode {
        const { id, name } = this.props.platform;

        return (
            <div className="game-container">
                <h2>Games for {name}</h2>
                <ul>
                    {this.store.games.map(item => (
                        <li key={item.id}>
                            {item.cover && (
                                <div>
                                    <img
                                        className="cover"
                                        src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${
                                            item.cover.cloudinary_id
                                        }.jpg`}
                                    />
                                </div>
                            )}
                            <div className="game-infos">
                                <div>
                                    <p>
                                        <b>
                                            <a
                                                href={
                                                    this.store.firstWebsite(
                                                        item
                                                    ) || '#'
                                                }
                                                target="_blank"
                                            >
                                                {item.name}
                                            </a>
                                        </b>
                                    </p>
                                    <p className="limit-lines">
                                        {item.summary}
                                    </p>
                                </div>
                                <span className="game-release">
                                    {this.store.firstReleaseDate(item, id)}
                                </span>
                            </div>
                            <button
                                data-game={item.id}
                                onClick={this.onRemoveGame}
                            >
                                x
                            </button>
                        </li>
                    ))}
                </ul>
                <Select
                    value={this.store.searchQuery}
                    searchable
                    emptyText={
                        this.store.searchLoading ? 'Loading...' : undefined
                    }
                    placeholder="Please enter a game..."
                    options={this.store.searchResultOptions}
                    onSearch={this.onSearchGame}
                    onChange={this.onAddGame}
                />
            </div>
        );
    }

    private onAddGame(game: typeof Game.Type): void {
        this.store.add(game, this.props.platform);
    }

    private onRemoveGame(e: React.SyntheticEvent<HTMLButtonElement>): void {
        const gameId = parseInt(e.currentTarget.getAttribute('data-game')!);

        this.store.remove(gameId);
    }

    @debounce(600, { trailing: true })
    private async onSearchGame(q: string) {
        if (q) {
            await this.store.search(q, this.props.platform.id);
        } else {
            this.store.resetSearch();
        }
    }
}
