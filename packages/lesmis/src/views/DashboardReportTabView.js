/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import { SmallAlert } from '@tupaia/ui-components';
import { useDashboardData } from '../api/queries';
import {
  FetchLoader,
  TabsLoader,
  TabBarSection,
  FlexCenter,
  Report,
  TabBar,
  Tabs,
  Tab,
  TabPanel,
  YearSelector,
} from '../components';
import { DEFAULT_DATA_YEAR, NAVBAR_HEIGHT_INT } from '../constants';
import { useUrlSearchParam } from '../utils';

const StickyTabBarContainer = styled.div`
  position: sticky;
  top: ${NAVBAR_HEIGHT_INT}px;
  z-index: 2;
`;

const DashboardSection = styled(FlexCenter)`
  min-height: 31rem;
`;

const ScrollToTopButton = styled(ArrowUpward)`
  position: fixed;
  bottom: 29px;
  right: 32px;
  cursor: pointer;
  font-size: 50px;
  color: white;
  padding: 10px;
  background: ${props => props.theme.palette.text.primary};
  border-radius: 3px;
`;

const DEFAULT_DASHBOARD_GROUP = 'Student Enrolment';
const SCHOOL_DEFAULT_DASHBOARD_GROUP = 'Students';

const getDefaultDashboard = data => {
  if (!data) {
    return null;
  }

  const dashboardNames = Object.keys(data);
  if (dashboardNames.includes(DEFAULT_DASHBOARD_GROUP)) {
    return DEFAULT_DASHBOARD_GROUP;
  }
  if (dashboardNames.includes(SCHOOL_DEFAULT_DASHBOARD_GROUP)) {
    return SCHOOL_DEFAULT_DASHBOARD_GROUP;
  }
  return dashboardNames[0];
};

const useStickyBarsHeight = () => {
  const [stickyBarsHeight, setStickyBarsHeight] = useState(0);

  const measureTabBarHeight = useCallback(tabBarNode => {
    if (tabBarNode !== null) {
      const tabBarHeight = tabBarNode.getBoundingClientRect().height;
      setStickyBarsHeight(tabBarHeight + NAVBAR_HEIGHT_INT);
    }
  }, []);

  return [stickyBarsHeight, measureTabBarHeight];
};

export const DashboardReportTabView = ({ entityCode, TabSelector }) => {
  const [selectedYear, setSelectedYear] = useUrlSearchParam('year', DEFAULT_DATA_YEAR);
  const [selectedDashboard, setSelectedDashboard] = useUrlSearchParam('dashboard');
  const [stickyBarsHeight, measureTabBarHeight] = useStickyBarsHeight();
  const [isScrolledPastTop, setIsScrolledPastTop] = useState(false);
  const { data, isLoading, isError, error } = useDashboardData(entityCode);

  const activeDashboard = selectedDashboard || getDefaultDashboard(data);

  const topRef = useRef();

  useEffect(() => {
    const detectScrolledPastTop = () =>
      setIsScrolledPastTop(topRef.current.getBoundingClientRect().top < stickyBarsHeight);

    // detect once when the effect is run
    detectScrolledPastTop();
    // and again on scroll events
    window.addEventListener('scroll', detectScrolledPastTop);

    return () => window.removeEventListener('scroll', detectScrolledPastTop);
  }, [stickyBarsHeight]);

  const scrollToTop = useCallback(() => {
    // if the top of the dashboards container is above the sticky dashboard header, scroll to the top
    if (isScrolledPastTop) {
      const newTop = topRef.current.offsetTop - stickyBarsHeight;
      window.scrollTo({ top: newTop, behavior: 'smooth' });
    }
  }, [isScrolledPastTop, stickyBarsHeight]);

  const handleChangeDashboard = (event, newValue) => {
    setSelectedDashboard(newValue);
    scrollToTop();
  };

  return (
    <>
      <StickyTabBarContainer ref={measureTabBarHeight}>
        <TabBar>
          <TabBarSection>
            {TabSelector}
            <YearSelector value={selectedYear} onChange={setSelectedYear} />
          </TabBarSection>
          {isLoading ? (
            <TabsLoader />
          ) : (
            <>
              <Tabs
                value={activeDashboard}
                onChange={handleChangeDashboard}
                variant="scrollable"
                scrollButtons="auto"
              >
                {Object.keys(data).map(heading => (
                  <Tab key={heading} label={heading} value={heading} />
                ))}
              </Tabs>
            </>
          )}
        </TabBar>
      </StickyTabBarContainer>
      <DashboardSection ref={topRef}>
        <FetchLoader isLoading={isLoading} isError={isError} error={error}>
          {data &&
            Object.entries(data).map(([heading, dashboardGroup]) => (
              <TabPanel key={heading} isSelected={heading === activeDashboard}>
                {Object.entries(dashboardGroup).map(([groupName, groupValue]) => {
                  // Todo: support other report types (including "component" types)
                  const dashboardReports = groupValue.views.filter(
                    report => report.type === 'chart',
                  );
                  return dashboardReports.length > 0 ? (
                    dashboardReports.map(report => (
                      <Report
                        key={report.viewId}
                        name={report.name}
                        entityCode={entityCode}
                        dashboardGroupName={heading}
                        dashboardGroupId={groupValue.dashboardGroupId.toString()}
                        reportId={report.viewId}
                        year={selectedYear}
                        periodGranularity={report.periodGranularity}
                      />
                    ))
                  ) : (
                    <SmallAlert key={groupName} severity="info" variant="standard">
                      There are no reports available for this dashboard
                    </SmallAlert>
                  );
                })}
              </TabPanel>
            ))}
        </FetchLoader>
      </DashboardSection>
      {isScrolledPastTop && <ScrollToTopButton onClick={scrollToTop} />}
    </>
  );
};

DashboardReportTabView.propTypes = {
  entityCode: PropTypes.string.isRequired,
  TabSelector: PropTypes.node.isRequired,
};
