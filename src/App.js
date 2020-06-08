import React from 'react';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import Papa from 'papaparse';
import teams from './teams.json';
import {Icon, Container, Table, Loader, Header, Segment} from 'semantic-ui-react';

export default class App extends React.Component {
  state = {
    stats: null,
    isProcessing: false
  };

  calcBattingAverages(rows) {
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

    return {
      averages,
      playerIDs: Object.keys(playerIDs),
      yearIDs: Object.keys(yearIDs)
    };
  }

  handleOnFileDrop = acceptedFiles => {
    this.setState({
      isProcessing: true,
      stats: null
    });
    Papa.parse(acceptedFiles[0], {
      // worker: true,
      header: true,
      dynamicTyping: true,
      delimiter: ",",
      newline: "\n",
      fastMode: true,
      skipEmptyLines: true,
      // step: function(row) {
      //   console.log("Row:", row.data);
      // },
      complete: (results) => {
        const stats = this.calcBattingAverages(results.data);
        this.setState({
          stats,
          isProcessing: false
        });
      }
    });
  }

  render() {
    const {isProcessing, stats} = this.state;
    return (
      <Container style={{padding: '2em 0'}}>
        <Header textAlign='center' size='huge' style={{padding: '1em 0'}}>Batting Average</Header>
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
        {isProcessing && (
          <section style={{textAlign: "center"}}>
            <Loader indeterminate size="medium" active inline>Processing your .csv file... Please wait.</Loader>
          </section>
        )}
        {stats !== null && (
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
              {stats.averages.map((a, i) => (
                <Table.Row key={i}>
                  <Table.Cell>{a.playerID}</Table.Cell>
                  <Table.Cell>{a.yearID}</Table.Cell>
                  <Table.Cell>{teams[a.teamID]}</Table.Cell>
                  <Table.Cell>{a.avg === null ? 'N/A' : a.avg.toFixed(3)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    );
  }
}
