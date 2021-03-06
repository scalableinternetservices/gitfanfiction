import { ApolloProvider, useQuery } from '@apollo/client'
import { Redirect, Router } from '@reach/router'
import * as React from 'react'
import { hydrate, render } from 'react-dom'
import { Provider as StyletronProvider } from 'styletron-react'
import { appContext } from '../../../common/src/context'
import { getApolloClient } from '../graphql/apolloClient'
import { style } from '../style/styled'
import { fetchUser } from './auth/fetchUser'
import { UserContext, UserCtx } from './auth/user'
import { Route } from './nav/route'
import { LoginPage } from './our_work/page/LoginPage'
import { PostPage } from './our_work/page/PostPage'
import { RequestFandomPage } from './our_work/page/RequestFandomPage'
import { SignupPage } from './our_work/page/SignupPage'
import * as TempPage from './our_work/page/TestPage'
import { TestPage } from './our_work/page/TestPage2'
import { ViewPage } from './our_work/page/ViewPage'
import { BrowseAll } from './page/BrowseAll'
import { LandingPage } from './page/LandingPage'
import { PlaygroundPage } from './page/PlaygroundPage'
import { PuppyPage } from './page/PuppyPage'
import { SearchPage } from './page/SearchPage'
import { ViewStoryPage } from './page/ViewStoryPage'

const Styletron = require('styletron-engine-monolithic')

export function init() {
  const renderFn = appContext().serverRendered ? hydrate : render
  const engine = new Styletron.Client({
    hydrate: document.getElementsByClassName('_styletron_hydrate_'),
  })

  renderFn(
    <ApolloProvider client={getApolloClient()}>
      <StyletronProvider value={engine}>
        <App />
      </StyletronProvider>
    </ApolloProvider>,
    document.getElementById('app')
  )
}

export function App() {
  const { loading, data } = useQuery(fetchUser)
  if (loading || data == null) {
    return null
  }

  return (
    <UserContext.Provider value={new UserCtx(data.self)}>
      <AppBody />
    </UserContext.Provider>
  )
}

export function AppBody() {
  return (
    <>
      <Router className={bodyClass}>
        <Redirect noThrow from="app" to="index" />
        <Redirect noThrow from="app/playground" to="surveys" />
        <TempPage.TestPage path={Route.HOME} />
        <PlaygroundPage path={Route.PLAYGROUND} />
        <PlaygroundPage path={Route.PLAYGROUND_APP} />
        <PuppyPage path={Route.PUPPY} />
        <BrowseAll path={Route.BROWSE_ALL} />
        <LandingPage path={Route.LANDING} />
        <LoginPage path={Route.LOGIN} />
        <SignupPage path={Route.SIGNUP} />
        <PostPage path={Route.POST} />
        <ViewStoryPage path={Route.VIEW_STORY} />
        <RequestFandomPage path={Route.REQUEST_FANDOM} />
        <TestPage path={'app/test'} />
        <ViewPage path={'app/view'} />
        <SearchPage path={Route.SEARCH} />
      </Router>
      <Footer>
        <FooterText>© 2020 Git Fan Fiction</FooterText>
      </Footer>
    </>
  )
}

//old one
// const bodyClass = 'flex flex-column items-center mh2 mh3-ns mh5-l pt6 min-vh-100 sans-serif'

//new bodyclass
const bodyClass = ''

const Footer = style('footer', 'fixed flex items-center bottom-0 w-100')

const FooterText = style('small', 'mid-gray avenir', { margin: 'auto', opacity: '0.2' })
