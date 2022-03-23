/**
 * Tupaia Web
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd.
 * This source code is licensed under the AGPL-3.0 license
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * ControlBar
 *
 * This is the base component for the search bar. Children in JSX will be rendered
 * on expansion.
 *
 * @prop {string} value The value being typed into the bar for search
 * @prop {boolean} isExpanded Will change the expanded state of ControlBar
 * @prop {function} onSearchChange Callback for changing the data prop when value is changed
 * @prop {function} onExpandClick Callback for what to do when expand is clicked
 * @prop {object} icon Define icon to use, should be react component
 * @prop {string} hintText The text displayed until user enters a value.
 * @prop {array} children Children components in JSX will be rendered in expansion
 */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import OpenIcon from 'material-ui/svg-icons/navigation/arrow-drop-down';
import CloseIcon from 'material-ui/svg-icons/navigation/arrow-drop-up';
import SearchIcon from 'material-ui/svg-icons/action/search';
import TextField from 'material-ui/TextField';
import { TRANS_BLACK, CONTROL_BAR_WIDTH, WHITE } from '../styles';

const wrapperPadding = 14;

const Container = styled.div`
  display: flex;
  flex-grow: ${props => (props.expanded ? 1 : 0)};
  flex-shrink: ${props => (props.expanded ? 1 : 0)};
  flex-basis: ${props => (props.expanded ? '160px' : '50px')};
  background-color: ${TRANS_BLACK};
  border-radius: 8px;
  width: ${CONTROL_BAR_WIDTH}px;
  flex-direction: column;
  pointer-events: auto;
  cursor: auto;
  transition: 0.5s;
  min-height: 0; /* firefox vertical scroll */
`;

const TopBar = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  height: 50px;
  padding-left: ${wrapperPadding}px;
  padding-right: ${wrapperPadding}px;
`;

const Expansion = styled.div`
  color: ${WHITE};
  padding-bottom: 10px;
  margin: 1px;
  padding-left: ${wrapperPadding}px;
  padding-right: ${wrapperPadding}px;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
`;

const IconContainer = styled.div`
  max-width: 24px;
  max-height: 26px;
  overflow: hidden;
  margin-right: 0.2rem;
`;

export class ControlBar extends PureComponent {
  render() {
    const { isExpanded, onSearchChange, onExpandClick, hintText, children } = this.props;

    const searchChange = !isExpanded
      ? event => {
          onSearchChange(event);
          onExpandClick(); // Should expand if it was not expanded
        }
      : onSearchChange;
    const searchFocus = !isExpanded
      ? () => {
          onExpandClick();
        }
      : null;
    const ExpandIcon = props =>
      isExpanded ? (
        <CloseIcon {...props} onClick={onExpandClick} />
      ) : (
        <OpenIcon {...props} onClick={onExpandClick} />
      );

    return (
      <Container onBlur={this.props.onControlBlur} expanded={isExpanded}>
        <TopBar>
          <IconContainer>
            <SearchIcon />
          </IconContainer>
          <TextField
            name="ControlBarField"
            onChange={searchChange}
            onFocus={searchFocus}
            hintText={hintText}
            underlineShow={false}
            autoComplete="off"
            style={{
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: '0%',
              paddingLeft: 6,
            }}
          />
          <ExpandIcon />
        </TopBar>
        {isExpanded ? <Expansion>{children}</Expansion> : null}
      </Container>
    );
  }
}

ControlBar.propTypes = {
  ...TextField.propTypes,
  value: PropTypes.string,
  isExpanded: PropTypes.bool,
  onSearchChange: PropTypes.func.isRequired,
  onExpandClick: PropTypes.func.isRequired,
  hintText: PropTypes.string,
};

ControlBar.defaultProps = {
  value: '',
  isExpanded: false,
  hintText: '',
};
