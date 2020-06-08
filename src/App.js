import React from 'react';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import Papa from 'papaparse';
import teams from './teams.json';
import memoize from 'memoize-one';
import {Icon, Container, Table, Loader, Header, Form, Select} from 'semantic-ui-react';

export default class App extends React.Component {
  state = {
    stats: null,
    isProcessing: false
  };

  static calcBattingAverages(rows) {
    const playerIDs = {};
    const yearIDs = {};
    const totals = {};
    let key;

    rows.forEach(row => {
      playerIDs[row.playerID] = true;
      yearIDs[row.yearID] = true;
      
      key = `${row.playerID}:${row.yearID}:${row.teamID}`;
      
      if (totals[key] === undefined) {
        totals[key] = {
          totalH: 0,
          totalAB: 0,
          teamID: row.teamID,
          playerID: row.playerID,
          yearID: row.yearID
        }
      }

      totals[key].totalH += row.H;
      totals[key].totalAB += row.AB;
    });

    const averages = [];
    let t;
    for(key in totals) {
      t = totals[key];
      averages.push({
        playerID: t.playerID,
        yearID: t.yearID,
        teamID: t.teamID,
        avg: t.totalH > 0 && t.totalAB > 0 ? t.totalH / t.totalAB : null
      });
    }

    averages.sort((a, b) => b.avg - a.avg);

    const uniquePlayerIDs = Object.keys(playerIDs);
    uniquePlayerIDs.sort((a, b) => a.localeCompare(b));

    const uniqueYearIDs = Object.keys(yearIDs);
    uniqueYearIDs.sort((a, b) => b.localeCompare(a));

    return {
      averages,
      uniquePlayerIDs,
      uniqueYearIDs
    };
  }

  handleOnFileDrop = acceptedFiles => {
    this.setState({
      isProcessing: true,
      stats: null
    });
    Papa.parse(acceptedFiles[0], {
      worker: true,
      header: true,
      dynamicTyping: true,
      delimiter: ",",
      newline: "\n",
      fastMode: true,
      skipEmptyLines: true,
      complete: (results) => {
        const stats = App.calcBattingAverages(results.data);
        this.setState({
          stats,
          isProcessing: false
        });
      }
    });
  }

  renderTable() {
    const { selectedPlayerID, selectedYearID } = this.state.stats;
    let filteredAverages = this.state.stats.averages;
    if (selectedPlayerID) {
      filteredAverages = filteredAverages.filter(a => a.playerID === selectedPlayerID);
    }
    if (selectedYearID) {
      const selectedYearIDAsInt = parseInt(selectedYearID, 10);
      filteredAverages = filteredAverages.filter(a => a.yearID === selectedYearIDAsInt);
    }
    return (
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>playerID</Table.HeaderCell>
            <Table.HeaderCell>yearID</Table.HeaderCell>
            <Table.HeaderCell>Team</Table.HeaderCell>
            <Table.HeaderCell>Avg</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredAverages.map((a, i) => (
            <Table.Row key={i}>
              <Table.Cell>{a.playerID}</Table.Cell>
              <Table.Cell>{a.yearID}</Table.Cell>
              <Table.Cell>{teams[a.teamID]}</Table.Cell>
              <Table.Cell>{a.avg === null ? 'N/A' : a.avg.toFixed(3)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }

  renderDropZone() {
    const {isProcessing} = this.state;
    return (
      <Dropzone onDrop={this.handleOnFileDrop}>
        {({getRootProps, getInputProps}) => (
          <div
          className={classNames(
            'ui blue inverted tertiary very padded center aligned segment', {
            disabled: isProcessing
          })}
          style={{cursor: isProcessing ? 'auto' : 'pointer'}}
          {...getRootProps()}>
            <input {...getInputProps()} />
            <Icon name="cloud upload" size="big" />
            <p>Drag and drop or upload .csv file</p>
          </div>
        )}
      </Dropzone>
    );
  }

  renderFilters = memoize((stats) => (
    <Form>
      <Form.Group>
      <Form.Field
          control={Select}
          options={stats.uniquePlayerIDs.map(p => ({ key: p, value: p, text: p }))}
          label={{ children: 'playerID',  htmlFor: 'form-select-control-player-id' }}
          search
          searchInput={{ id: 'form-select-control-player-id' }}
          clearable
          lazyLoad
          onChange={(_, data) => this.setState({
            stats: {
              ...this.state.stats,
              selectedPlayerID: data.value
            }
          })}
        />
        <Form.Field
          control={Select}
          options={stats.uniqueYearIDs.map(y => ({ key: y, value: y, text: y }))}
          label={{ children: 'yearID',  htmlFor: 'form-select-control-year-id' }}
          search
          searchInput={{ id: 'form-select-control-year-id' }}
          clearable
          lazyLoad
          onChange={(_, data) => this.setState({
            stats: {
              ...this.state.stats,
              selectedYearID: data.value
            }
          })}
        />
      </Form.Group>
    </Form>
  ));

  renderPleaseWait = () => (
    <section style={{textAlign: "center"}}>
      <Loader indeterminate size="medium" active inline>Processing your .csv file... Please wait.</Loader>
    </section>
  );

  render() {
    return (
      <Container style={{padding: '2em 0'}}>
        <Header textAlign='center' size='huge' style={{padding: '1em 0'}}>Batting Average</Header>
        {this.renderDropZone()}
        {this.state.isProcessing && this.renderPleaseWait()}
        {this.state.stats !== null && (
          <React.Fragment>
            {this.renderFilters(this.state.stats)}
            {this.renderTable()}
          </React.Fragment>
        )}
      </Container>
    );
  }
}
