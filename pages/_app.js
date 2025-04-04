import Layout from '../components/layout';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;