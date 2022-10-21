export const sanitize_string = (values) => {
    if (values.category === 'send' || values.category === 'borrow') return 'Trade';
    if (values.category === 'sales') {
        const description = values.buyerName.toLowerCase();
        return description.charAt(0).toUpperCase()+description.slice(1);
    }
    if (values.category === 'buys') {
        const description = values.itemName.toLowerCase();
        return description.charAt(0).toUpperCase()+description.slice(1)+(` (${values.vendorName.toLowerCase()})` || '');
    }
}
