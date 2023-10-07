export const sanitize_string = (values) => {
    if (values.category === 'trades') return 'Trade';
    if (values.category === 'sales') {
        const description = values.buyer_name.toLowerCase();
        return description.charAt(0).toUpperCase()+description.slice(1);
    }
    if (values.category === 'expenses') {
        let description = values.item_name?.toLowerCase();
        let vendor = values.vendor_name?.toLowerCase();
        if (typeof values.item_name !== 'string') description = '';
        if (typeof values.vendor_name === 'string') {
            return description.charAt(0).toUpperCase()+description.slice(1)+(` (${vendor})` || '');
        } else {
            return description.charAt(0).toUpperCase()+description.slice(1);
        }
    }
}
