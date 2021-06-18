const initState = {}

const moneyReducer = (state = initState, action) => {
    switch (action.type) {
        case 'MONEY_SENT':
            console.log('money sent ', action.money);
            return {
                ...state
            };
        case 'REPAID':
            console.log('borrow cleared ');
            return state;

        case 'OWE_OTHERS':
            console.log('balance partially/fully cleared ');
            return state;

        case 'REPAID_ERROR':
            console.log('borrow clearing error', action.error);
            return state;

        case 'BORROW_SUCCESS':
            console.log('money borrowed');
            return state;

        case 'BORROW_FAILED':
            console.log('borrowing failed ', action.error);
            return state;

        case 'LATE_REPAID':
            console.log('completed successfully');
            return state;

        case 'LATE_ERROR':
            console.log('ERROR Occurred');
            return state;
        case 'MONEY_ERROR':
            console.log('error sending money', action.error);
            return state;
        case 'CLEAR_ERROR':
            console.log('Clearing balance error', action.error);
            return state;
        default:
            return state;
    }
}

export default moneyReducer;
