/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import DateRangeIcon from '@material-ui/icons/DateRange';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import CircularProgress from '@material-ui/core/CircularProgress';
import MuiButton from '@material-ui/core/Button';
import MuiButtonGroup from '@material-ui/core/ButtonGroup';
import MuiIconButton from '@material-ui/core/IconButton';
import { DatePickerDialog } from './DatePickerDialog';
import { FlexStart } from '../Layout';
import { GRANULARITIES, GRANULARITY_SHAPE } from '../Chart';
import { useDateRangePicker } from './useDateRangePicker';

const IconButton = styled(MuiIconButton)`
  border: 1px solid ${props => props.theme.palette.grey['400']};
  border-radius: 3px;
  padding: 0.7rem 0.8rem;
  margin-left: 0.9rem;
  min-height: 3.1rem;

  .MuiSvgIcon-root {
    color: ${props => props.theme.palette.text.tertiary};
  }
`;

const Button = styled(MuiButton)`
  padding: 0.7rem;
  font-size: 1rem;
  min-height: 3.1rem;
  line-height: 1.2rem;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
  border-color: ${props => props.theme.palette.grey['400']};

  .MuiSvgIcon-root {
    color: ${props => props.theme.palette.text.tertiary};
  }
`;

const Label = styled(Button)`
  padding-left: 1rem;
  padding-right: 1rem;
  min-width: 11.25rem;
  pointer-events: none;
`;

export const DateRangePicker = ({
  startDate,
  endDate,
  minDate,
  maxDate,
  granularity,
  onSetDates,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const {
    isSingleDate,
    currentStartDate,
    currentEndDate,
    handleDateChange,
    changePeriod,
    nextDisabled,
    prevDisabled,
    labelText,
  } = useDateRangePicker({
    startDate,
    endDate,
    minDate,
    maxDate,
    granularity,
    onSetDates,
  });

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <FlexStart>
        <MuiButtonGroup>
          {isSingleDate && (
            <Button
              aria-label="prev"
              onClick={() => changePeriod(-1)}
              disabled={isLoading || prevDisabled}
            >
              <KeyboardArrowLeftIcon />
            </Button>
          )}
          <Label aria-label="active-date">{labelText}</Label>
          {isSingleDate && (
            <Button
              type="button"
              aria-label="next"
              onClick={() => changePeriod(1)}
              disabled={isLoading || nextDisabled}
            >
              <KeyboardArrowRightIcon />
            </Button>
          )}
        </MuiButtonGroup>
        <IconButton onClick={handleOpen}>
          {isLoading ? <CircularProgress size={21} /> : <DateRangeIcon />}
        </IconButton>
      </FlexStart>
      {isOpen && (
        <DatePickerDialog
          granularity={granularity}
          startDate={currentStartDate}
          endDate={currentEndDate}
          minDate={minDate}
          maxDate={maxDate}
          isOpen={isOpen}
          onClose={handleClose}
          onSetNewDates={handleDateChange}
        />
      )}
    </>
  );
};

DateRangePicker.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
  granularity: GRANULARITY_SHAPE,
  onSetDates: PropTypes.func,
  isLoading: PropTypes.bool,
};

DateRangePicker.defaultProps = {
  startDate: null,
  endDate: null,
  minDate: null,
  maxDate: null,
  granularity: GRANULARITIES.DAY,
  onSetDates: () => {},
  isLoading: false,
};
