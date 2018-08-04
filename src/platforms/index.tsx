import * as React from 'react';
import { observer } from 'mobx-react';
import { bindAll, debounce } from 'lodash-decorators';
import { Select } from 'react-slct';
import { Platform, PlatformStore } from '../state/platform';

interface PlatformsProps {
    onSelect(platform?: typeof Platform.Type): void;
}

@bindAll()
@observer
export class Platforms extends React.Component<PlatformsProps> {
    private store = PlatformStore.create({
        searchQuery: '',
        searchResults: []
    });

    public componentDidMount() {
        this.store.load();
    }

    public render(): React.ReactNode {
        const { platforms } = this.store;

        return (
            <div className="platform-container">
                <h2>Platforms</h2>
                <ul>
                    {platforms.map(platform => (
                        <li key={platform.name}>
                            <button
                                data-platform={platform.id}
                                onClick={this.onSelectPlatform}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0
                                }}
                            >
                                {platform.name}
                            </button>
                            <button
                                data-platform={platform.id}
                                onClick={this.onRemovePlatform}
                                style={{
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0
                                }}
                            >
                                x
                            </button>
                        </li>
                    ))}
                </ul>
                <Select
                    value={this.store.searchQuery}
                    searchable
                    placeholder="Please enter a platform..."
                    options={this.store.searchResultOptions}
                    onSearch={this.onSearchPlatform}
                    onChange={this.onAddPlatform}
                />
            </div>
        );
    }

    private onAddPlatform(platform: typeof Platform.Type): void {
        this.store.add(platform);
        this.store.resetSearch();
    }

    private onRemovePlatform(e: React.SyntheticEvent<HTMLButtonElement>): void {
        const id = parseInt(e.currentTarget.getAttribute('data-platform')!);

        this.store.remove(id);
        this.props.onSelect();
    }

    private onSelectPlatform(e: React.SyntheticEvent<HTMLButtonElement>): void {
        const id = parseInt(e.currentTarget.getAttribute('data-platform')!);
        const platform = this.store.get(id);

        if (platform) {
            this.props.onSelect(platform);
        }
    }

    @debounce(600, { trailing: true })
    private async onSearchPlatform(q: string) {
        if (q) {
            await this.store.search(q);
        } else {
            this.store.resetSearch();
        }
    }
}
