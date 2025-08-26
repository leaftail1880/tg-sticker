// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace TelegramExport {
	export interface Result {
		chats: Chats
	}

	export interface Chats {
		list: Chat[]
	}

	export interface Chat {
		name: string
		id: number
		type: 'personal_chat'
		messages: Message[]
	}

	type Message = StickerMessage | BaseMessage

	export interface BaseMessage {
		id: number
		type: 'message'
		media_type?: string
		from: string
		date_unixtime: string
		from_id: string
	}

	export interface StickerMessage extends BaseMessage {
		media_type: 'sticker'
		sticker_emoji: string
		file: string
		thumbnail: string
	}
}
