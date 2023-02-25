import React from "react"

const NotFound = (props) => {
	return (
		<div className="notfoundpanel">
			<h1>404</h1>
			<h3>Page Not Found!</h3>
			<a href="/" className="btn btn-success" type="button">
				<i className="fa fa-location-arrow" />
				&nbsp; Home
			</a>
			<hr className="darken" />
		</div>
	)
}

export default NotFound
