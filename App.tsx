import React, { Component } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RtcEngine, { ClientRole, ChannelProfile } from 'react-native-agora';
import requestCameraAndAudioPermission from './components/Permission';
import styles from './components/Style';

interface Props {}

/**
 * @property appId Agora App ID
 * @property token Token for the channel;
 * @property isHost Boolean value to select between broadcaster and audience
 * @property channelName Channel Name for the current session
 * @property joinSucceed State variable for storing success
 * @property peerIds Array for storing connected peers
 */
interface State {
  appId: string;
  token: string | null;
  isHost: boolean;
  channelName: string;
  joinSucceed: boolean;
  peerIds: number[];
}

export default class App extends Component<null, State> {
  _engine?: RtcEngine;

  constructor(props) {
    super(props);
    this.state = {
      appId: 'ENTER APP ID HERE',
      token: null,
      isHost: true,
      channelName: 'channel-x',
      joinSucceed: false,
      peerIds: [],
    };
    if (Platform.OS === 'android') {
      // Request required permissions from Android
      requestCameraAndAudioPermission().then(() => {
        console.log('requested!');
      });
    }
  }

  componentDidMount() {
    this.init();
  }

  /**
   * @name init
   * @description Function to initialize the Rtc Engine, attach event listeners and actions
   */
  init = async () => {
    const { appId } = this.state;
    this._engine = await RtcEngine.create(appId);
    await this._engine?.setChannelProfile(ChannelProfile.LiveBroadcasting);
    await this._engine?.setClientRole(
      this.state.isHost ? ClientRole.Broadcaster : ClientRole.Audience
    );

    this._engine.addListener('Warning', (warn) => {
      console.log('Warning', warn);
    });

    this._engine.addListener('Error', (err) => {
      console.log('Error', err);
    });

    this._engine.addListener('UserJoined', (uid, elapsed) => {
      console.log('UserJoined', uid, elapsed);
      // Get current peer IDs
      const { peerIds } = this.state;
      // If new user
      if (peerIds.indexOf(uid) === -1) {
        this.setState({
          // Add peer ID to state array
          peerIds: [...peerIds, uid],
        });
      }
    });

    this._engine.addListener('UserOffline', (uid, reason) => {
      console.log('UserOffline', uid, reason);
      const { peerIds } = this.state;
      this.setState({
        // Remove peer ID from state array
        peerIds: peerIds.filter((id) => id !== uid),
      });
    });

    // If Local user joins RTC channel
    this._engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
      console.log('JoinChannelSuccess', channel, uid, elapsed);
      // Set state variable to true
      this.setState({
        joinSucceed: true,
      });
    });
  };

  /**
   * @name toggleRoll
   * @description Function to toggle the roll between broadcaster and audience
   */
  toggleRoll = async () => {
    // Join Channel using null token and channel name
    this.setState(
      {
        isHost: !this.state.isHost,
      },
      async () => {
        await this._engine?.setClientRole(
          this.state.isHost ? ClientRole.Broadcaster : ClientRole.Audience
        );
      }
    );
  };

  /**
   * @name startCall
   * @description Function to start the call
   */
  startCall = async () => {
    // Join Channel using null token and channel name
    await this._engine?.joinChannel(
      this.state.token,
      this.state.channelName,
      null,
      0
    );
  };

  /**
   * @name endCall
   * @description Function to end the call
   */
  endCall = async () => {
    await this._engine?.leaveChannel();
    this.setState({ peerIds: [], joinSucceed: false });
  };

  render() {
    const { joinSucceed, isHost, channelName } = this.state;
    return (
      <View style={styles.max}>
        <View style={styles.spacer}>
          <Text style={styles.roleText}>
            You're {isHost ? 'a broadcaster' : 'the audience'}
          </Text>
          <Text style={joinSucceed ? styles.roleTextGreen : styles.roleTextRed}>
            {joinSucceed
              ? 'Connected to ' + channelName
              : 'Disconnected - start call'}
          </Text>
        </View>

        {this._renderUsers()}

        <View style={styles.buttonHolder}>
          <TouchableOpacity onPress={this.toggleRoll} style={styles.button}>
            <Text style={styles.buttonText}> Toggle Role </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.startCall} style={styles.buttonGreen}>
            <Text style={styles.buttonText}> Start Call </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.endCall} style={styles.buttonRed}>
            <Text style={styles.buttonText}> End Call </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  _renderUsers = () => {
    const { joinSucceed, peerIds, isHost } = this.state;
    return joinSucceed ? (
      <View style={styles.fullView}>
        <Text style={styles.subHeading}>Broadcaster List</Text>
        {isHost ? <Text>• You</Text> : <></>}
        <ScrollView>
          {peerIds.map((value, index) => {
            return (
              <Text key={value}>
                • Broadcaster {index + 1} - (UID {value})
              </Text>
            );
          })}
        </ScrollView>
      </View>
    ) : null;
  };
}
