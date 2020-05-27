import color_f from './color_f';

import { le_dw_value, le_dw_bytes } from './util';

import each from 'lodash/each';
import mapValues from 'lodash/mapValues';
import transform from 'lodash/transform';
import parseInt from 'lodash/parseInt';

export default function (rom, offsets) {
    const methods = {};

    let items = transform(offsets,
        (items, offset) => {
            const [r, g, b] = offset >= 0 ? raw(offset) : oam(-offset);
            items[offset] = color_f(r / 31, g / 31, b / 31);
        },
        {});

    function raw(offset) {
        const color = le_dw_value(rom, offset);
        const r = (color >>> 0) & 0x1F;
        const g = (color >>> 5) & 0x1F;
        const b = (color >>> 10) & 0x1F;
        return [r, g, b];
    }

    function oam(offset) {
        const r = rom[offset + 0] & 0x1F;
        const g = rom[offset + 1] & 0x1F;
        const b = rom[offset + 4] & 0x1F;
        return [r, g, b];
    }

    methods.blend = blend;
    function blend(blend_fn, blend_color) {
        items = mapValues(items, color => blend_fn(color, blend_color));
    };

    methods.write_to_rom = write_to_rom;
    function write_to_rom(rom) {
        each(items, (color, offset) => {
            offset = parseInt(offset);
            offset >= 0 ? raw(color, offset) : oam(color, -offset)
        });

        function raw(color, offset) {
            const [r, g, b] = snes_5bit_channels(color);
            const value = snes_color_value(r, g, b);
            le_dw_bytes(value, rom, offset);
        }

        function oam(color, offset) {
            const [r, g, b] = snes_5bit_channels(color);
            rom[offset + 0] = 0x20 | r;
            rom[offset + 1] = 0x40 | g;
            rom[offset + 3] = 0x40 | g;
            rom[offset + 4] = 0x80 | b;
        }

        function snes_5bit_channels(color) {
            const r = (color.r * 31 + .5) >>> 0;
            const g = (color.g * 31 + .5) >>> 0;
            const b = (color.b * 31 + .5) >>> 0;
            return [r, g, b];
        }

        function snes_color_value(r, g, b) {
            return r | (g << 5) | (b << 10);
        }
    }

    return methods;
};