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
        searchResults: []
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
        const { name } = this.props.platform;

        return (
            <div className="game-container">
                <h2>Games for {name}</h2>
                <ul>
                    {this.store.games.map(item => (
                        <li
                            key={item.id}
                            data-game={item.id}
                            onClick={this.onExpandGame}
                        >
                            {this.renderCover(item)}
                            {this.renderGameInfos(item)}
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

    private renderCover(game: typeof Game.Type) {
        if (!game.cover) {
            return null;
        }

        return (
            <div>
                <img
                    className="cover"
                    src={this.store.getImage(game.cover.cloudinary_id)}
                />
            </div>
        );
    }

    private renderGameInfos(game: typeof Game.Type) {
        const { gameExpanded } = this.store;
        return (
            <div className="game-infos">
                <div className="title">
                    <b>
                        <a
                            href={this.store.firstWebsite(game) || '#'}
                            target="_blank"
                        >
                            {game.name}
                        </a>
                    </b>
                    <div className="game-release">
                        {this.store.firstReleaseDate(
                            game,
                            this.props.platform.id
                        )}
                    </div>
                </div>
                <div>
                    <div
                        className={
                            gameExpanded === game.id
                                ? 'game-summary'
                                : 'limit-lines game-summary'
                        }
                    >
                        {game.summary}
                    </div>
                    {gameExpanded === game.id &&
                        game.screenshots && (
                            <div className="game-gallery">
                                {game.screenshots.map(s => {
                                    const src = this.store.getImage(
                                        s.cloudinary_id
                                    );
                                    const srcBig = this.store.getImage(
                                        s.cloudinary_id,
                                        't_screenshot_huge'
                                    );

                                    return (
                                        <a
                                            key={srcBig}
                                            href={srcBig}
                                            target="_blank"
                                        >
                                            <img src={src} />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                </div>
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

    private onExpandGame(e: React.SyntheticEvent<HTMLLIElement>): void {
        const { target } = e;

        if (
            target instanceof HTMLDivElement &&
            target.classList.contains('game-summary')
        ) {
            const gameId = parseInt(e.currentTarget.getAttribute('data-game')!);

            this.store.expandGame(gameId);
        }
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
