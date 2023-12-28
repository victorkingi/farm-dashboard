export const sanitize_string = (values) => {
    if (values.col_id === 5) return 'Trade';
    if (values.col_id === 1) {
        const description = values.buyer.toLowerCase();
        return description.charAt(0).toUpperCase()+description.slice(1);
    }
    if (values.col_id === 2) {
        let description = values.item_name?.toLowerCase();
        let vendor = values.extra_data?.vendor?.toLowerCase();
        if (typeof values.item_name !== 'string') description = '';
        if (typeof values.extra_data?.vendor === 'string') {
            return description.charAt(0).toUpperCase()+description.slice(1)+(` (${vendor})` || '');
        } else {
            return description.charAt(0).toUpperCase()+description.slice(1);
        }
    }
}
