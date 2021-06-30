import React, { createContext, useContext } from 'react'

export const AppContext = createContext('App')
export const useAppContext = function useAppContext() {
  return useContext(AppContext)
}
useAppContext.displayName = 'useAppContext'
AppContext.displayName = 'AppContext'
