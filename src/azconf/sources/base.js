export default class Source {
  constructor() {
    this._entries = [];
  }

  /**
   * Array of all config entries provided by this source
   * @return {ConfEntry[]} config entries
   */
  get entries() {
    return this._entries;
  }
}