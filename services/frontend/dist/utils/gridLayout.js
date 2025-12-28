/**
 * Brutalist Grid Layout Utilities
 *
 * 16-column grid system for finer layout control
 * Variable row count depending on page needs
 * Gap-based borders (2px black gaps acting as borders)
 *
 * Usage:
 * - Use 16-column grid: grid grid-cols-16 gap-[2px] bg-black p-[2px]
 * - Each cell should have bg-white
 * - For spanning cells: col-span-{n} row-span-{n}
 * - Rows can be flexible: grid-rows-[auto_1fr_auto] or fixed: grid-rows-16
 *
 * Example:
 * <div class="grid grid-cols-16 gap-[2px] bg-black p-[2px]">
 *   <div class="bg-white p-5 col-span-4 row-span-3">Content</div>
 * </div>
 */
/**
 * Generate Tailwind grid position classes
 */
export function getGridClasses(cell) {
    const colSpan = cell.colEnd - cell.colStart;
    const rowSpan = cell.rowEnd - cell.rowStart;
    let classes = 'bg-white';
    if (colSpan > 1)
        classes += ` col-span-${colSpan}`;
    if (rowSpan > 1)
        classes += ` row-span-${rowSpan}`;
    // Add cell-specific classes
    switch (cell.type) {
        case 'menu':
            classes += ' hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer';
            break;
        case 'image':
            classes += ' p-0 overflow-hidden';
            break;
        case 'empty':
            classes += ' p-2.5';
            break;
        default:
            classes += ' p-5';
    }
    return classes;
}
/**
 * Predefined grid layouts for 16-column system
 */
export const GRID_LAYOUTS = {
    navbar: {
        columns: 16,
        rows: 2,
        cells: [
            { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3, type: 'menu' }, // HOME vertical (2 cols, 2 rows)
            { colStart: 3, colEnd: 5, rowStart: 1, rowEnd: 2, type: 'menu' }, // PLAY (2 cols)
            { colStart: 5, colEnd: 11, rowStart: 1, rowEnd: 3, type: 'content' }, // TITLE (6 cols, 2 rows)
            { colStart: 11, colEnd: 13, rowStart: 1, rowEnd: 2, type: 'menu' }, // TOURNAMENT (2 cols)
            { colStart: 13, colEnd: 15, rowStart: 1, rowEnd: 2, type: 'menu' }, // LEADERBOARD (2 cols)
            { colStart: 15, colEnd: 17, rowStart: 1, rowEnd: 2, type: 'menu' }, // PROFILE (2 cols)
            { colStart: 3, colEnd: 5, rowStart: 2, rowEnd: 3, type: 'menu' }, // SOCIAL (2 cols)
            { colStart: 11, colEnd: 13, rowStart: 2, rowEnd: 3, type: 'menu' }, // SETTINGS (2 cols)
            { colStart: 13, colEnd: 17, rowStart: 2, rowEnd: 3, type: 'menu' }, // LOGOUT (4 cols)
        ],
    },
};
