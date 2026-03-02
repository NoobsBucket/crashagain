import NavBar from "../components/navbar";
import SearchBar from "../components/searchBar";
import Banner from "../components/banner";
import Page from "../components/cardDisplay";

export default function Home() {
  return (
    <div className="main">
      <NavBar />
         <SearchBar />
   
      <Banner />
      <Page />
  
    </div>
  );
}
