import React, { createContext } from 'react';
import { User } from '../lib/types';


export const UserContext = createContext({
    isLoggedIn: false,
    user: {},
    login: () => { },
    logout: () => { }
});
