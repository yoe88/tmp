import React, {useEffect, useRef, useState} from 'react';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import {
  Alert,
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
} from 'react-native';
import {ShouldStartLoadRequest} from 'react-native-webview/lib/WebViewTypes';
import Contacts from 'react-native-contacts';
import Toast from 'react-native-toast-message';

function App(): React.JSX.Element {
  const webViewRef = useRef<any>();
  const webUrl = 'https://www.sms17.com/m2/main.php';
  //const webUrl = 'http://192.168.123.108:3000';
  const [state, setState] = useState({url: '', canGoBack: false});

  // rn에서 웹뷰로 변수 호출
  const handleEndLoading = (loadingState: string) => {
    if (!webViewRef) {
      return;
    }
    //console.log('handleEndLoading', state, loadingState);
    /** rn에서 웹뷰로 정보를 보내는 메소드 */
    webViewRef.current.postMessage(
      JSON.stringify({type: 'LOADING', data: loadingState}),
    );
  };

  const handleIsApp = () => {
    if (!webViewRef) {
      return;
    }
    webViewRef.current.postMessage(
      JSON.stringify({type: 'IS_APP', data: 'true'}),
    );
  };

  // 웹뷰에서 rn으로 호출
  const onMessageFromWebView = async ({nativeEvent}: WebViewMessageEvent) => {
    const {key} = JSON.parse(nativeEvent.data);

    if (key === 'getContacts') {
      const list: {
        tel: string;
        name: string;
        note: string;
        company: string | null;
      }[] = [];
      const contacts = await fetchContacts();
      if (contacts == null) {
        return;
      }

      console.log('fetchContacts = ', contacts);
      contacts.forEach(c => {
        c.phoneNumbers.forEach(n => {
          list.push({
            tel: n.number,
            name: c.displayName,
            company: c.company,
            note: c.note,
          });
        });
      });

      //webViewRef.current.postMessage(JSON.stringify(list));
      webViewRef.current.injectJavaScript(
        `window.onLoadContacts(${JSON.stringify(list)})`,
      );
    }
  };

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    console.log('onNavigationStateChange', navState);
    setState({url: navState.url, canGoBack: navState.canGoBack});
    //webViewRef.current.injectJavaScript(injectJavaScript);
  };

  function handleShouldStartLoadWithRequest(request: ShouldStartLoadRequest) {
    if (!request.url.includes('sms17.com')) {
      Linking.openURL(request.url);
      return false;
    }
    return true;
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  //연락처 조회
  async function fetchContacts() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: '연락처 권한 요청',
            message: '연락처를 가져오기 위해 권한이 필요합니다.',
            buttonNeutral: '나중에 묻지 않기',
            buttonNegative: '거부',
            buttonPositive: '허용',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          /*webViewRef.current.injectJavaScript(
            'window.displayContacts(setLoading(true))',
          );*/
          webViewRef.current.injectJavaScript('$("#progressDiv").show();');
          let contacts = await Contacts.getAll();
          /*webViewRef.current.injectJavaScript(
            'window.displayContacts(setLoading(false))',
          );*/
          await sleep(277);
          webViewRef.current.injectJavaScript(
            '$("#progressPercent").text("40%");',
          );
          await sleep(277);
          webViewRef.current.injectJavaScript(
            '$("#progressPercent").text("70%");',
          );
          await sleep(277);
          webViewRef.current.injectJavaScript(
            '$("#progressPercent").text("100%");',
          );
          await sleep(277);
          webViewRef.current.injectJavaScript('$("#progressDiv").hide();');
          return contacts;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          Toast.show({
            type: 'error',
            position: 'bottom',
            text1: '권한이 없어 이용할 수 없습니다.',
          });
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            '주소록 권한이 필요합니다.',
            '권한을 허용하기 위해서 설정으로 이동합니다.',
            [
              {text: '취소', style: 'default'},
              {text: '확인', onPress: () => Linking.openSettings()},
            ],
          );
        }
      } catch (err) {
        console.warn(err);
      }
    } else if (Platform.OS === 'ios') {
      //Linking.openURL('app-settings:');
      return await Contacts.getAll();
    }

    return null;
  }

  useEffect(() => {
    function onBackPress() {
      if (state.canGoBack) {
        webViewRef.current.goBack();
      } else {
        Alert.alert('종료하시겠습니까?', '확인을 누르면 종료합니다.', [
          {text: '취소', style: 'default'},
          {text: '확인', onPress: () => BackHandler.exitApp()},
        ]);
      }

      return true;
    }

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [state.canGoBack, state.url]);

  const injectedJavaScript = `
          (function() {
            window.getContacts = async function() {
              return new Promise((resolve, reject) => {
                window.ReactNativeWebView.postMessage('getContacts');
                window.displayContacts = function(contacts) {
                  resolve(contacts);
                }
              });
            }
          })();
        `;

  /**
   * https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#props-index
   * https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md#guide-index
   */
  return (
    <SafeAreaView style={{flex: 1}}>
      <WebView
        ref={webViewRef}
        source={{uri: webUrl}}
        onNavigationStateChange={onNavigationStateChange}
        bounces={false}
        // 웹뷰가 앱에 맨 처음 load 시작 되는 함수
        onLoadStart={() => {
          handleEndLoading('start');
        }}
        // 웹뷰가 앱에 맨 처음 load 종료 될때 트리거 되는 함수
        onLoadEnd={() => {
          handleEndLoading('end');
          handleIsApp();
        }}
        onMessage={onMessageFromWebView}
        javaScriptEnabled={true}
        javaScriptEnabledAndroid={true}
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        //ios 스와이프 뒤로 가기
        allowsBackForwardNavigationGestures={true}
        //injectedJavaScript={injectedJavaScript}
      />
      <Toast />
    </SafeAreaView>
  );
}

export default App;
