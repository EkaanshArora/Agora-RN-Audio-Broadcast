import React, { Component } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RtcEngine, { ClientRole, ChannelProfile } from 'react-native-agora';
import requestCameraAndAudioPermission from './components/Permission';
import styles from './components/Style';
import RtmEngine from 'agora-react-native-rtm';

interface Props {}

/**
 * @property appId Agora App ID
 * @property token Token for the channel;
 * @property isHost Boolean value to select between broadcaster and audience
 * @property channelName Channel Name for the current session
 * @property joinSucceed State variable for storing success
 * @property rtcUid local user's UID on joining the RTC channel
 * @property peerIds Array for storing connected peers
 * @property myUsername local user's name to login to RTM
 * @property Array to store usernames mapped to RTC UIDs
 */

interface State {
  appId: string;
  token: string | null;
  isHost: boolean;
  channelName: string;
  joinSucceed: boolean;
  rtcUid: number;
  peerIds: number[];
  myUsername: string;
  usernames: { [uid: string]: string };
}

export default class App extends Component<null, State> {
  _engine?: RtcEngine;
  rtmEngine?: RtmEngine;

  constructor(props) {
    super(props);
    this.state = {
      appId: '30a6bc89994d4222a71eba01c253cbc7',
      token: null,
      isHost: true,
      channelName: 'channel-x',
      joinSucceed: false,
      rtcUid: parseInt((new Date().getTime() + '').slice(4, 13), 10),
      peerIds: [],
      myUsername: '',
      usernames: {},
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
    this.initRTM();
  }

  componentWillUnmount() {
    this.rtmEngine?.destroyClient();
    this._engine?.destroy();
  }

  /**
   * @name init
   * @description Function to initialize the Rtc Engine, attach event listeners and actions
   */
  init = async () => {
    const { appId, isHost } = this.state;
    this._engine = await RtcEngine.create(appId);
    this._engine.enableVideo();
    await this._engine?.setChannelProfile(ChannelProfile.LiveBroadcasting);
    await this._engine?.setClientRole(
      isHost ? ClientRole.Broadcaster : ClientRole.Audience
    );

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
      this.setState({
        joinSucceed: true,
        rtcUid: uid,
      });
    });
  };

  /**
   * @name initRTM
   * @description Function to initialize the Rtm Engine, attach event listeners and use them to sync usernames
   */
  initRTM = async () => {
    let { appId, usernames, rtcUid } = this.state;

    this.rtmEngine = new RtmEngine();
    this.rtmEngine.on('error', (evt) => {
      console.log(evt);
    });

    this.rtmEngine.on('channelMessageReceived', (evt) => {
      let { text } = evt;
      let data = text.split(':');
      console.log('cmr', evt);

      if (data[1] === '!leave') {
        let temp = JSON.parse(JSON.stringify(usernames));
        Object.keys(temp).map((k) => {
          if (k === data[0]) delete temp[k];
        });
        this.setState({
          usernames: temp,
        });
      } else {
        this.setState({
          usernames: { ...usernames, [data[0]]: data[1] },
        });
      }
    });

    this.rtmEngine.on('messageReceived', (evt) => {
      let { text } = evt;
      let data = text.split(':');
      console.log('pm', evt);
      this.setState({
        usernames: { ...usernames, [data[0]]: data[1] },
      });
    });

    this.rtmEngine.on('channelMemberJoined', (evt) => {
      console.log('!spm', this.state.myUsername);
      this.rtmEngine?.sendMessageToPeer({
        peerId: evt.uid,
        text: rtcUid + ':' + this.state.myUsername,
        offline: false,
      });
    });

    await this.rtmEngine.createClient(appId).catch((e) => console.log(e));
  };

  /**
   * @name toggleRole
   * @description Function to toggle the roll between broadcaster and audience
   */
  toggleRole = async () => {
    this._engine?.setClientRole(
      !this.state.isHost ? ClientRole.Broadcaster : ClientRole.Audience
    );
    this.setState((ps) => {
      return { isHost: !ps.isHost };
    });
  };

  /**
   * @name startCall
   * @description Function to start the call
   */
  startCall = async () => {
    let { myUsername, token, channelName, rtcUid } = this.state;
    if (myUsername) {
      // Join RTC Channel using null token and channel name
      await this._engine?.joinChannel(token, channelName, null, rtcUid);
      // Login & Join RTM Channel
      await this.rtmEngine
        ?.login({ uid: myUsername })
        .catch((e) => console.log(e));
      await this.rtmEngine
        ?.joinChannel(channelName)
        .catch((e) => console.log(e));
      await this.rtmEngine
        ?.sendMessageByChannelId(channelName, rtcUid + ':' + myUsername)
        .catch((e) => console.log(e));
    }
  };

  /**
   * @name endCall
   * @description Function to end the call
   */
  endCall = async () => {
    await this._engine?.leaveChannel();
    let { channelName, rtcUid } = this.state;
    await this.rtmEngine
      ?.sendMessageByChannelId(channelName, rtcUid + ':!leave')
      .catch((e) => console.log(e));
    this.setState({ peerIds: [], joinSucceed: false, usernames: {} });
    await this.rtmEngine?.logout().catch((e) => console.log(e));
  };

  render() {
    const { joinSucceed, isHost, channelName, myUsername } = this.state;
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
        {joinSucceed ? (
          <></>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={'Name'}
              onChangeText={(t) => {
                this.setState({ myUsername: t });
              }}
              value={myUsername}
            />
            {!myUsername ? <Text>Name can't be blank</Text> : null}
          </>
        )}
        <View style={styles.buttonHolder}>
          <TouchableOpacity onPress={this.toggleRole} style={styles.button}>
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
    const { joinSucceed, peerIds, isHost, usernames, myUsername } = this.state;

    return joinSucceed ? (
      <View style={styles.fullView}>
        <Text style={styles.subHeading}>Broadcaster List</Text>
        {isHost ? <Text>{myUsername}</Text> : <></>}
        <ScrollView>
          {peerIds.map((value, index) => {
            return <Text key={index}>{usernames[value + '']}</Text>;
          })}
        </ScrollView>
        <Text style={styles.subHeading}>Audience List</Text>
        {!isHost ? <Text>{myUsername}</Text> : <></>}
        <ScrollView>
          {Object.keys(usernames).map((key, index) => {
            return (
              <Text key={index}>
                {peerIds.includes(parseInt(key, 10)) ? null : usernames[key]}
              </Text>
            );
          })}
        </ScrollView>
      </View>
    ) : null;
  };
}
