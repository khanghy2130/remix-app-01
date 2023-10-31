
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import type { Database } from '../database.types'

import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator
} from "@remix-run/react";
import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/auth-helpers-remix'
import { useLocation } from "@remix-run/react";


import stylesheet from "~/tailwind.css";
import { ThemeProvider, useTheme, ThemeType } from '~/utils/ThemeProvider';
import { getThemeSession } from './utils/theme.server';
import Navbar from "./components/Navbar";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export type LoaderData = {
  theme: ThemeType | null;
  env: { [key: string]: string }
};

export const loader: LoaderFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);

  const data: LoaderData = {
    theme: themeSession.getTheme(),
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    }
  };

  return json(data)
}


function App() {
  const { env } = useLoaderData<LoaderFunction>()
  const [supabase] = useState(() =>
    createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  )

  // recalling loaders when authentication state changes
  const revalidator = useRevalidator()
  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      revalidator.revalidate()
    })
  
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, revalidator])


  const [theme] = useTheme();



  // hide nav for specific routes
  const location = useLocation();
  const routesToHideNavigation = ['/login', '/signup'];
  const shouldHideNavigation = routesToHideNavigation.includes(location.pathname);

  

  return (
    <html lang="en" className={theme ?? ""}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {shouldHideNavigation ? null : <Navbar/>}
        
        <Outlet  context={{ supabase }}  />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function AppWithProviders() {
  const data = useLoaderData<LoaderData>();
  return (
    <ThemeProvider specifiedTheme={data.theme}>
      <App />
    </ThemeProvider>
  );
}