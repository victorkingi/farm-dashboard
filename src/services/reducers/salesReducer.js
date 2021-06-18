const initState = {}

const salesReducer = function (state = initState, action) {
    switch (action.type) {
        case 'INPUT_SALES':
            console.log('sales data added', action.sales)
            return state;
        case 'INPUT_SALES_ERROR':
            console.log('sales data error', action.error);
            return state;
        default:
            return state;
    }
}

export default salesReducer;
