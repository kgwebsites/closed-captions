import React, { Component } from 'react';
import MaterialIcon, {colorPallet} from 'material-icons-react';
import styled, {injectGlobal} from 'styled-components';
import Notification from 'react-web-notification';
import {isNil} from 'lodash';
import hey from './hey.png';

injectGlobal`
  @font-face {
    font-family: 'Open Sans';
    src: url('https://fonts.googleapis.com/css?family=Open+Sans:300');
  }
  body {
    margin: 0;
  }
`

const StyledApp = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: 'Open Sans', sans-serif;
  font-size: 48px;
  height: 100vh;
  width: 100vw;
  ${({themeLight}) => !themeLight ? `
    background-color: #333;
    color: #eee;
  ` : ''}
  .App__Wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: .5rem;
  }
  .App__Theme {
    position: fixed;
    cursor: pointer;
    right: .5rem;
    top: .5rem;
    transform: translateY(-35%);
  }
  .App__Mic {
    cursor: pointer;
    position: relative;
    i {
      position: absolute;
      transform: translate(-50%, -100%);
    }
  }
  .App__Text {
    min-height: 65px;
  }
`;

class App extends Component {
  constructor() {
    super();
    const themeLight = localStorage.getItem('themeLight') !== 'false';
    this.state = {
      on: false,
      text: '',
      finalText: '',
      notify: false,
      alert: false,
      available: true,
      themeLight: !isNil(themeLight) ? themeLight : true
    };

    if (!('webkitSpeechRecognition' in window)) this.setState({available: false});
    else this.initializeSpeech();
  }

  initializeSpeech = () => {
    this.recognition = new window.webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 0;
    this.recognition.onstart = () => {this.setState({on: true})};
    this.recognition.onresult = ({results, resultIndex}) => {
      if (typeof(results) === 'undefined') return this.recognition.stop();
      for (let i = resultIndex; i < results.length; ++i) {
        const text = results[i][0].transcript;
        if (!results[i].isFinal) this.setState({text});
        else {
          this.setState({finalText: text, notify: true, alert: text.toLowerCase().includes('hey')});
          this.loop();
          this.setState({notify: false});
        }
      }
    };
  }

  loop = () => {
    this.recognition.stop();
    try {
      this.recognition.start();
    } catch (e) {
      setTimeout(() => {
        this.loop();
      }, 100);
    } finally {
      return;
    }
  }

  start = () => this.recognition.start();

  end = async () => {
    await this.recognition.stop();
    this.setState({on: false})
  }

  toggleTheme = async () => {
    await this.setState({themeLight: !this.state.themeLight});
    localStorage.setItem('themeLight', this.state.themeLight);
  };

  render() {
    return (
      <StyledApp className="App" themeLight={this.state.themeLight}>
        <div className="App__Wrapper">
          <Notification
            ignore={!this.state.notify && this.state.finalText !== ''}
            // notSupported={this.handleNotSupported.bind(this)}
            // onPermissionGranted={this.handlePermissionGranted.bind(this)}
            // onPermissionDenied={this.handlePermissionDenied.bind(this)}
            // onShow={this.handleNotificationOnShow.bind(this)}
            // onClick={this.handleNotificationOnClick.bind(this)}
            // onClose={this.handleNotificationOnClose.bind(this)}
            // onError={this.handleNotificationOnError.bind(this)}
            timeout={10000}
            title="Closed Captions"
            options={{
              body: this.state.finalText,
              tag: Date.now(),
              icon: this.state.alert ? hey : null,
              silent: true,
            }}
          />
          <div className="App__Mic" onClick={this.state.on ? this.end : this.start}>
            <MaterialIcon
              size="large"
              icon={this.state.on ? 'mic' : 'mic_off'}
              color={colorPallet[this.state.on ? 'green' : 'red']._500}
            />
          </div>
          <div className="App__Text">{this.state.text}</div>
          <div className="App__Theme" onClick={this.toggleTheme}>
            <MaterialIcon icon="invert_colors" color={this.state.themeLight ? null : '#FFF'} />
          </div>
        </div>
      </StyledApp>
    );
  }
}

export default App;
