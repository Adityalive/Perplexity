import {ConfigureStore} from '@reduxjs/toolkit';

export const store = ConfigureStore({
    reducer:{
        user: userReducer,
    }
})
export default store;