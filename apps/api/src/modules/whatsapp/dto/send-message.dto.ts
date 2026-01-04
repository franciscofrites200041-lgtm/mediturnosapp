import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateNested, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum WhatsAppMessageType {
    TEXT = 'text',
    TEMPLATE = 'template',
}

export class SendTextDto {
    @IsNotEmpty()
    @IsString()
    body: string;

    @IsOptional()
    @IsBoolean()
    preview_url?: boolean;
}

export class SendTemplateDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsObject()
    language: { code: string };

    @IsOptional()
    components?: any[];
}

export class SendMessageDto {
    @IsNotEmpty()
    @IsString()
    to: string;

    @IsNotEmpty()
    @IsEnum(WhatsAppMessageType)
    type: WhatsAppMessageType;

    @ValidateNested()
    @Type(() => SendTextDto)
    @IsOptional()
    text?: SendTextDto;

    @ValidateNested()
    @Type(() => SendTemplateDto)
    @IsOptional()
    template?: SendTemplateDto;
}
