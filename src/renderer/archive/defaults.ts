//todo move into model files

export const user = {
  displayName: 'Matt Erhart',
  email: 'mattjerhart@gmail.com',
  uid: '5pthBzKepDNFtuQvO9GkUKANYJQ2',
  isSignedIn: false,
  dbUserPath: '',
  loaded: 'defaults' as any
};

export type iUser = Partial<typeof user>;

export type iReferenceTypes =
  | 'abstraction'
  | 'text selection'
  | 'figure selection'
  | 'something in another publication';

export const defaultPoint = {
     object: 'point',
      key: '0',
      offset: 0,
      path: [0, 0]
}

export const textSelection = {
  id: '',
  text: '',
  pubId: '1',
  abstractionId: '',
  userId: '',
  slate: {
    anchor: {
      object: '',
      key: '',
      offset: undefined as number,
      path: undefined as number []
    },
    focus: {
      object: '',
      key: '',
      offset: undefined as number,
      path: undefined as number []
    }
  },
  comment: '',
  style: {color: 'black', backgroundColor: 'white'}
};
export type iTextSelection = Partial<typeof textSelection>;

export const figureSelection = {
  id: 'a unique id',
  pubId: 'id of paper being selected',
  figureId: 'id of fig being selected',
  left: -1,
  right: -1,
  top: -1,
  bottom: -1
};
export type iFigureSelection = Partial<typeof figureSelection>;

export type iAbstractionTypes = 'term' | 'claim';
const ids = {
  pubId: '1',
  uid: 'userid'
};
export const abstraction = {
  ...ids,
  id: ids.pubId + '-' + ids.uid,
  userId: 'pxutTYjueCToqkQOjNdQdM9EMsm2',
  text: 'glossary item or a claim',
  textSelections: [textSelection],
  figureSelections: [figureSelection],
  comment: 'user input', // explain relations here @mention selections
  tags: ['definition'],
  style: {color: 'black', backgroundColor: 'white'}
};
export type iAbstraction = Partial<typeof abstraction>;