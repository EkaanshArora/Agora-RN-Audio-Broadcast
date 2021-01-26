import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  max: {
    flex: 1,
    marginVertical: 40,
  },
  buttonHolder: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0093E9',
    borderRadius: 24,
  },
  buttonRed: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F4061D',
    borderRadius: 24,
  },
  buttonGreen: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#09DF18',
    borderRadius: 24,
  },
  buttonText: {
    color: '#fff',
  },
  fullView: {
    flex: 5,
    alignContent: 'center',
    marginHorizontal: 24,
  },
  centerText: {
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  remote: {
    width: 150,
    height: 150,
    marginHorizontal: 2.5,
  },
  noUserText: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: '#0093E9',
  },
  roleText: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
  },
  roleTextGreen: {
    textAlign: 'center',
    fontSize: 18,
    color: '#09DF18',
  },
  roleTextRed: {
    textAlign: 'center',
    fontSize: 18,
    color: '#F4061D',
  },
  spacer: { marginBottom: 32 },
});
