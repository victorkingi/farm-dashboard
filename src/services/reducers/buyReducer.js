const initState = {}

const buyReducer = (state = initState, action) => {
    switch (action.type) {
        case 'INPUT_BUYING':
            console.log('buying data added', action.values);
            return state;
        case 'INPUT_BUYING_ERROR':
            console.log(action.error);
            return state;
        default:
            return state;
    }
}

export default buyReducer;
