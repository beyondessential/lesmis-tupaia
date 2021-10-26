/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import styled from 'styled-components';
import MuiContainer from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import CircularProgress from '@material-ui/core/CircularProgress';
import { NAVBAR_HEIGHT, YELLOW } from '../constants';
import { SearchBar, FlexEnd, FlexStart } from '../components';
import { useProjectEntitiesData } from '../api/queries';

const Wrapper = styled.div`
  position: relative;
  height: 800px; // fallback height for older browsers
  height: calc(100vh - ${NAVBAR_HEIGHT});
  background-size: cover;
  background-position: right top;
`;

const Container = styled(MuiContainer)`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 3rem;
  height: 100%;

  @media screen and (min-width: 600px) {
    padding-left: 50px;
    padding-right: 50px;
  }
`;

const Main = styled.div`
  position: relative;
  padding-top: 3rem; // fallback for older browsers
  padding-top: 17vh;
  left: 0;

  @media screen and (max-width: 600px) {
    padding-top: 3rem;
  }
`;

const Title = styled(Typography)`
  font-style: normal;
  font-weight: 600;
  font-size: 2rem;
  line-height: 3rem;
  margin-bottom: 1.8rem;
  color: white;
`;

const YellowTitle = styled.span`
  color: ${YELLOW};
`;

const Info = styled(FlexStart)`
  align-items: flex-start;
  color: white;

  @media screen and (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const InfoSection = styled.div`
  margin-right: 4rem;
  max-width: 20rem;
  padding-bottom: 2.5rem;
`;

const InfoHeading = styled(Typography)`
  font-style: normal;
  font-weight: 600;
  font-size: 1.125rem;
  line-height: 1.4;
  margin-bottom: 0.65rem;
`;

const InfoText = styled(Typography)`
  font-size: 1rem;
  line-height: 1.5;
`;

const Footer = styled(MuiContainer)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`;

const FooterInner = styled(FlexEnd)`
  color: white;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  padding-bottom: 1rem;

  .MuiTypography-root {
    font-size: 0.85rem;
  }
`;

const INFO_LINK = 'https://info.tupaia.org';

export const HomeView = React.memo(() => {
  const { isLoading } = useProjectEntitiesData();

  return (
    // The background image is applied here instead of the styled component as it creates a flicker when added there
    <Wrapper style={{ backgroundImage: "url('/images/home-cover.png')" }}>
      <Container maxWidth="xl">
        <Main>
          <Title variant="h1">
            Find a location <br />
            to <YellowTitle>start viewing data</YellowTitle>
          </Title>
          {isLoading && <CircularProgress size={60} />}
          <SearchBar />
        </Main>
        <Info>
          <InfoSection>
            <InfoHeading variant="h5">About LESMIS</InfoHeading>
            <InfoText>
              The Lao PDR Education and Sports Management Information System (LESMIS) is a
              GIS-enabled data aggregation, analysis and visualization platform for improved data
              management and utilization for monitoring and planning.
            </InfoText>
          </InfoSection>
          <InfoSection>
            <InfoHeading variant="h5">Contact us</InfoHeading>
            <InfoText>Ph: +856 20 55617710</InfoText>
            <InfoText>Website: www.moes.edu.la</InfoText>
          </InfoSection>
        </Info>
        <Footer maxWidth="xl">
          <FooterInner>
            <Typography>
              Powered by{' '}
              <Link href={INFO_LINK} color="inherit" underline="always">
                Tupaia
              </Link>
            </Typography>
          </FooterInner>
        </Footer>
      </Container>
    </Wrapper>
  );
});
