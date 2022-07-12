
export interface SlackRequest {
    type: string;
    user: User;
    api_app_id: string;
    token: string;
    container: Container;
    trigger_id: string;
    team: Team;
    enterprise: Channel;
    is_enterprise_install: boolean;
    channel: Channel;
    message: Message;
    state: State;
    response_url: string;
    actions: Action[];
}

export interface Action {
    action_id: string;
    block_id: string;
    text: Text;
    value: string;
    style: string;
    type: string;
    action_ts: string;
}

export interface Text {
    type: string;
    text: string;
    emoji?: boolean;
    verbatim?: boolean;
}

export interface Channel {
    id: string;
    name: string;
}

export interface Container {
    type: string;
    message_ts: string;
    channel_id: string;
    is_ephemeral: boolean;
}

export interface Metadata {
    event_type: string;
    event_payload: any;
}

export interface Message {
    bot_id: string;
    type: string;
    text: string;
    user: string;
    ts: string;
    app_id: string;
    team: string;
    blocks: Block[];
    metadata: Metadata;
}

export interface Block {
    type: string;
    block_id: string;
    text?: Text;
    elements?: Element[];
}

export interface Element {
    type: string;
    action_id: string;
    text: Text;
    style: string;
    value: string;
}

export interface State {
    values: Values;
}

export interface Values {
}

export interface Team {
    id: string;
    domain: string;
    enterprise_id: string;
    enterprise_name: string;
}

export interface User {
    id: string;
    username: string;
    name: string;
    team_id: string;
}
