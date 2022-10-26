export const sanitize_string = (values) => {
    if (values.category === 'send' || values.category === 'borrow') return 'Trade';
    if (values.category === 'sales') {
        const description = values.buyerName.toLowerCase();
        return description.charAt(0).toUpperCase()+description.slice(1);
    }
    if (values.category === 'buys') {
        let description = values.itemName?.toLowerCase();;
        let vendor = values.vendorName?.toLowerCase();
        if (typeof values.itemName !== 'string') description = '';
        if (typeof values.vendorName !== 'string') vendor = '';
        return description.charAt(0).toUpperCase()+description.slice(1)+(` (${vendor})` || '');
    }
}
