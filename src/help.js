import React, {Component} from 'react';
import './App.css';
import VideoPlayer from  './components/Player';
import Library from './components/Library';
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';
const {desktopCapturer} = window.require('electron');
const remote = window.require('electron').remote;
const ps = remote.require('ps-node')
const util = require('util');
const psLookup = util.promisify(ps.lookup);


class App extends Component{

    constructor(props){
        super(props);
        this.state ={
        recording : false,
         active : false,
        }
    }
 
    async componentDidMount(){
        setInterval(this.loadData, 10000)
    }

  async loadData() {
     try {
        let x = await psLookup({command : 'Program x'});
        console.log(x)
    } catch (e) {
        console.log(e);
    }
  }


  render(){
    return (
      <Router>
        <div>
          <Link to="/"><h1>Plays</h1></Link>
          <Switch>
            <Route path="/" exact component ={Library}/>
            <Route path="/player/:id" component ={VideoPlayer}/>
          </Switch>
        </div>
      </Router>

    );
  }

}

export default App;