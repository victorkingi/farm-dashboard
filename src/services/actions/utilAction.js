export const sanitize_string = (str, extra) => {
    if (str === 'send' || str === 'borrow') return 'Trade';
    if (!extra) return '';
    if (str === 'sales') {
        extra = extra.toLowerCase();
        return extra.charAt(0).toUpperCase()+extra.slice(1);
    }
    else if (str === 'buys') {
        extra = extra.toLowerCase();
        return extra.charAt(0).toUpperCase()+extra.slice(1);
    }
}
