import React, { createContext } from 'react';

export const UserContext = createContext({
    isLoggedIn: false,
    user: null,
    login: () => { },
    logout: () => { }
});
